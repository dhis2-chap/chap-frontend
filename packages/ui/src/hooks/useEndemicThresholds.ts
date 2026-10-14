import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { canonicalizePeriodId } from '@dhis2-chap/core';
import {
    ApiError,
    DatasetsService,
    type AlertLevel,
    type ThresholdResponse,
} from '../httpfunctions';
import type { PredictionOrgUnitSeries } from '../interfaces/Prediction';
import { getSeriesPeriods } from '../utils/chartPeriods';
import { buildEndemicThresholdMap, getThresholdLineRoles } from '../utils/outbreakAlerts';
import { getThresholdQueryState } from '../utils/thresholdQueryState';

type ThresholdParams = AlertLevel['thresholdParams'];

type Props = {
    datasetId: number | undefined;
    series: PredictionOrgUnitSeries[];
    params: ThresholdParams;
    enabled?: boolean;
};

// Fresh forever while cached, but garbage-collect unused responses so a
// session of param experimentation cannot grow the query cache unboundedly.
const THRESHOLDS_CACHE_TIME = 30 * 60 * 1000;

const useThresholdRequest = (series: PredictionOrgUnitSeries[]) => {
    // Request thresholds for exactly the periods the charts display. Actual
    // cases and predictions can spell the same week differently (2025W3 vs
    // 2025W03), so deduplicate by canonical id while keeping the first spelling.
    const periodIds = useMemo(() => {
        const periodIdByCanonicalId = new Map<string, string>();
        for (const periodId of series.flatMap(getSeriesPeriods)) {
            const canonicalId = canonicalizePeriodId(periodId);
            if (!periodIdByCanonicalId.has(canonicalId)) {
                periodIdByCanonicalId.set(canonicalId, periodId);
            }
        }
        return Array.from(periodIdByCanonicalId.values());
    }, [series]);
    const locations = useMemo(() => (
        series.map(orgUnitSeries => orgUnitSeries.orgUnitId)
    ), [series]);
    return { periodIds, locations };
};

const getThresholdsQueryOptions = (
    datasetId: number | undefined,
    { periodIds, locations }: ReturnType<typeof useThresholdRequest>,
    params: ThresholdParams,
) => ({
    queryKey: ['endemic-thresholds', datasetId, periodIds, locations, params],
    queryFn: async () => {
        if (!datasetId) throw new Error('datasetId is required');

        return await DatasetsService.computeThresholdsV1AnalyticsThresholdsPost({
            datasetId,
            periodIds,
            locations,
            params,
        });
    },
    staleTime: Infinity,
    cacheTime: THRESHOLDS_CACHE_TIME,
    retry: 0,
});

// Derive the line roles from the lines echoed in the response: with
// keepPreviousData the visible data can belong to the previous request.
const toThresholdMap = (data: ThresholdResponse) => (
    buildEndemicThresholdMap(data.entries, getThresholdLineRoles(data.lines))
);

export const useEndemicThresholds = ({
    datasetId,
    series,
    params,
    enabled = true,
}: Props) => {
    const request = useThresholdRequest(series);
    const isQueryEnabled = enabled && !!datasetId && request.periodIds.length > 0;

    const query = useQuery<ThresholdResponse, ApiError>({
        ...getThresholdsQueryOptions(datasetId, request, params),
        enabled: isQueryEnabled,
        keepPreviousData: true,
    });
    const { data, error, refetch } = query;

    const thresholdMap = useMemo(() => (data ? toThresholdMap(data) : undefined), [data]);

    return {
        thresholdMap,
        ...getThresholdQueryState(isQueryEnabled, query),
        error: isQueryEnabled ? error : null,
        refetch,
    };
};

/** One threshold map per params, in the same order, to compare several strategies at once. */
export const useEndemicThresholdsForParams = ({
    datasetId,
    series,
    paramsList,
}: Omit<Props, 'params' | 'enabled'> & { paramsList: ThresholdParams[] }) => {
    const request = useThresholdRequest(series);
    const queries = useQueries({
        queries: paramsList.map(params => ({
            ...getThresholdsQueryOptions(datasetId, request, params),
            enabled: !!datasetId && request.periodIds.length > 0,
            // A stable select keeps each map's identity until its data changes.
            select: toThresholdMap,
        })),
    });

    return {
        thresholdMaps: queries.map(query => query.data),
        isLoading: queries.some(query => query.isInitialLoading),
        error: queries.find(query => query.error)?.error as ApiError | undefined,
    };
};
