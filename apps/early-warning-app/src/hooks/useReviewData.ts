import { useDataEngine } from '@dhis2/app-runtime';
import { useQueries, useQuery } from '@tanstack/react-query';
import { canonicalizePeriodId, getLastNPeriods, PERIOD_TYPES } from '@dhis2-chap/core';
import {
    AlertPoliciesService, PredictionsService, PredictionSetupsService,
    BacktestsService, DatasetsService, buildPredictionSeries, getSeriesPeriods,
    buildEndemicThresholdMap, getThresholdLineRoles,
    type AlertPolicyRead, type EndemicThresholdPoint,
} from '@dhis2-chap/ui';
import { usePendingPredictionAlerts } from './usePredictionReviews';

export type ReviewOrgUnit = {
    id: string;
    displayName: string;
    level: number;
    ancestors?: { id: string; displayName: string; level: number }[];
};
export type ReviewThresholds = Map<number, Map<string, Map<string, EndemicThresholdPoint[]>>>;
const QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9];

export const useReviewData = (predictionId: number) => {
    const engine = useDataEngine();
    const enabled = Number.isSafeInteger(predictionId) && predictionId > 0;
    const pending = usePendingPredictionAlerts(predictionId);
    const entries = useQuery({
        queryKey: ['predictionEntries', predictionId, QUANTILES],
        queryFn: () => PredictionsService.getPredictionEntriesV1AnalyticsPredictionEntryPredictionIdGet(predictionId, QUANTILES),
        enabled,
    });
    const setupId = pending.prediction?.predictionSetupId;
    const setup = useQuery({
        queryKey: ['predictionSetup', setupId],
        queryFn: () => PredictionSetupsService.getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet(setupId!),
        enabled: setupId != null,
    });
    const policyIds = [...new Set([
        ...pending.alerts.map(alert => alert.alertPolicyId),
        ...(setup.data?.alertPolicy ? [setup.data.alertPolicy.id] : []),
    ])];
    const policyQueries = useQueries({ queries: policyIds.map(id => ({
        queryKey: ['alertPolicy', id],
        queryFn: () => AlertPoliciesService.getAlertPolicyV1CrudAlertPoliciesAlertPolicyIdGet(id),
    })) });
    const policies = policyQueries.flatMap(query => query.data ? [query.data] : []);
    const orgUnitIds = [...new Set([
        ...(entries.data ?? []).map(entry => entry.orgUnit),
        ...pending.alerts.map(alert => alert.orgUnit),
    ])].sort();
    const metadata = useQuery({
        queryKey: ['reviewOrgUnits', orgUnitIds],
        queryFn: async () => {
            const response = await engine.query({ units: {
                resource: 'organisationUnits',
                params: { paging: false, fields: 'id,displayName,level,ancestors[id,displayName,level]', filter: `id:in:[${orgUnitIds.join(',')}]` },
            } });
            return (response.units as { organisationUnits: ReviewOrgUnit[] }).organisationUnits;
        },
        enabled: orgUnitIds.length > 0,
        staleTime: Infinity,
        cacheTime: Infinity,
    });
    const orgUnits = new Map((metadata.data ?? []).map(unit => [unit.id, unit]));
    const dataset = pending.prediction?.dataset;
    const actual = useQuery({
        queryKey: ['reviewActualCases', dataset?.id, orgUnitIds],
        queryFn: () => BacktestsService.getActualCasesV1AnalyticsActualCasesBacktestIdGet(dataset!.id, orgUnitIds, true),
        enabled: dataset != null && orgUnitIds.length > 0,
    });
    const periodType = dataset?.periodType?.toUpperCase() as keyof typeof PERIOD_TYPES | undefined;
    const historyCount = periodType === 'WEEK' ? 52 : periodType === 'MONTH' ? 24 : undefined;
    const historyPeriods = dataset?.lastPeriod && periodType && historyCount
        ? new Set(getLastNPeriods(dataset.lastPeriod, periodType, historyCount).map(canonicalizePeriodId))
        : undefined;
    const series = buildPredictionSeries(entries.data ?? [], orgUnits, '',
        actual.data?.data.filter(point => !historyPeriods || historyPeriods.has(canonicalizePeriodId(point.pe))), periodType)
        .sort((a, b) => a.orgUnitName.localeCompare(b.orgUnitName));
    const periods = [...new Set(series.flatMap(getSeriesPeriods))];
    const levels = policies.flatMap(policy => (policy.levels ?? []).map(level => ({ policy, level })));
    const thresholds = useQueries({ queries: levels.map(({ level }) => ({
        queryKey: ['reviewThresholds', dataset?.id, orgUnitIds, periods, level.thresholdParams],
        queryFn: () => DatasetsService.computeThresholdsV1AnalyticsThresholdsPost({
            datasetId: dataset!.id, locations: orgUnitIds, periodIds: periods, params: level.thresholdParams,
        }),
        enabled: dataset != null && periods.length > 0,
        staleTime: Infinity,
    })) });
    const thresholdsByPolicy: ReviewThresholds = new Map();
    levels.forEach(({ policy, level }, index) => {
        const data = thresholds[index].data;
        if (!data) return;
        const policyThresholds = thresholdsByPolicy.get(policy.id) ?? new Map();
        policyThresholds.set(level.name, buildEndemicThresholdMap(data.entries, getThresholdLineRoles(data.lines)));
        thresholdsByPolicy.set(policy.id, policyThresholds);
    });
    const required = [entries, metadata, setup];
    return {
        prediction: pending.prediction,
        setup: setup.data,
        alerts: pending.alerts,
        entries: entries.data ?? [],
        series,
        orgUnits,
        policies: policies as AlertPolicyRead[],
        thresholdsByPolicy,
        isLoading: pending.isLoading || required.some(query => query.isInitialLoading),
        error: pending.error || required.find(query => query.error)?.error,
        thresholdError: [...policyQueries, ...thresholds, actual].find(query => query.error)?.error,
        thresholdsLoading: [...policyQueries, ...thresholds, actual].some(query => query.isInitialLoading),
    };
};
export type ReviewData = ReturnType<typeof useReviewData>;
