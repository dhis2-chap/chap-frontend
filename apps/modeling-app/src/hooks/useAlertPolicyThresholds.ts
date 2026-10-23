import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    buildEndemicThresholdMap,
    DatasetsService,
    getThresholdLineRoles,
    OpenAPI,
    type AlertLevel,
    type AlertPolicyRead,
    type EndemicThresholdPoint,
    type PredictionOrgUnitSeries,
    type ThresholdChartLine,
} from '@dhis2-chap/ui';
import { getThresholdQueryState } from '@/utils/thresholdQueryState';
import { fractionToPercentString } from '@/utils/thresholdStrategyParams';
import { THRESHOLDS_CACHE_TIME, useThresholdScope } from './useEndemicThresholds';

type Props = {
    datasetId: number;
    series: PredictionOrgUnitSeries[];
    policies: AlertPolicyRead[];
    enabled: boolean;
};

// Same colour as the exploration line: the level colours belong to the alert
// shading, since levels sharing a line differ only in exceedance probability.
const POLICY_LINE_COLOR = '#212934';

// A policy level describes a single line, so list-valued params hold one entry.
const single = (value: number | number[] | undefined) => (Array.isArray(value) ? value[0] : value);

const describeThreshold = (params: AlertLevel['thresholdParams']): string => {
    if (params.type === 'seasonal' && 'stdMultiplier' in params) {
        return i18n.t('Seasonal mean + {{stdMultiplier}} SD', { stdMultiplier: single(params.stdMultiplier) });
    }
    if (params.type === 'percentile' && 'quantile' in params) {
        const percent = fractionToPercentString(single(params.quantile) ?? 0);
        return params.baselineYears
            ? i18n.t('{{percent}}th percentile, {{count}}-year baseline', { percent, count: params.baselineYears })
            : i18n.t('{{percent}}th percentile', { percent });
    }
    return params.type;
};

// Levels often share threshold parameters and differ only in the exceedance
// probability, so one line is drawn per distinct set of parameters.
const getPolicyLines = (policies: AlertPolicyRead[]) => {
    const byParams = new Map<string, AlertLevel['thresholdParams']>();
    for (const level of policies.flatMap(policy => policy.levels ?? [])) {
        byParams.set(JSON.stringify(level.thresholdParams), level.thresholdParams);
    }
    return [...byParams.values()].map((params, index) => ({
        id: `policy-threshold-${index}`,
        label: describeThreshold(params),
        params,
    }));
};

export const useAlertPolicyThresholds = ({ datasetId, series, policies, enabled }: Props) => {
    const { periodIds, locations } = useThresholdScope(series);
    const lines = useMemo(() => getPolicyLines(policies), [policies]);
    const isQueryEnabled = enabled && lines.length > 0 && periodIds.length > 0;
    const query = useQuery<Map<string, EndemicThresholdPoint[]>[], ApiError>({
        queryKey: ['alert-policy-thresholds', OpenAPI.BASE, datasetId, periodIds, locations, lines.map(line => line.params)],
        queryFn: () => Promise.all(lines.map(async ({ params }) => {
            const response = await DatasetsService.computeThresholdsV1AnalyticsThresholdsPost({
                datasetId, periodIds, locations, params,
            });
            return buildEndemicThresholdMap(response.entries, getThresholdLineRoles(response.lines));
        })),
        enabled: isQueryEnabled,
        staleTime: Infinity,
        cacheTime: THRESHOLDS_CACHE_TIME,
        retry: false,
    });
    const linesByOrgUnit = useMemo(() => {
        const result = new Map<string, ThresholdChartLine[]>();
        query.data?.forEach((thresholds, index) => {
            const { id, label } = lines[index];
            thresholds.forEach((points, orgUnit) => {
                const orgUnitLines = result.get(orgUnit) ?? [];
                orgUnitLines.push({ id, label, color: POLICY_LINE_COLOR, points });
                result.set(orgUnit, orgUnitLines);
            });
        });
        return result;
    }, [query.data, lines]);

    return {
        linesByOrgUnit,
        ...getThresholdQueryState(isQueryEnabled, query),
        error: isQueryEnabled ? query.error : null,
        refetch: query.refetch,
    };
};
