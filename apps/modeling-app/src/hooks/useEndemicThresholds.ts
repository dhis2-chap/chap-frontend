import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { canonicalizePeriodId } from '@dhis2-chap/core';
import {
    ApiError,
    buildEndemicThresholdMap,
    DatasetsService,
    getSeriesPeriods,
    getThresholdLineRoles,
    type PredictionOrgUnitSeries,
    type ThresholdResponse,
} from '@dhis2-chap/ui';
import type { ThresholdParams } from '@/utils/thresholdStrategyParams';
import { getThresholdQueryState } from '@/utils/thresholdQueryState';

type Props = {
    datasetId: number | undefined;
    series: PredictionOrgUnitSeries[];
    params: ThresholdParams;
    enabled?: boolean;
};

// Fresh forever while cached, but garbage-collect unused responses so a
// session of param experimentation cannot grow the query cache unboundedly.
const THRESHOLDS_CACHE_TIME = 30 * 60 * 1000;

export const useEndemicThresholds = ({
    datasetId,
    series,
    params,
    enabled = true,
}: Props) => {
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
    const isQueryEnabled = enabled && !!datasetId && periodIds.length > 0;

    const query = useQuery<ThresholdResponse, ApiError>({
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
        enabled: isQueryEnabled,
        keepPreviousData: true,
        staleTime: Infinity,
        cacheTime: THRESHOLDS_CACHE_TIME,
        retry: 0,
    });
    const { data, error, refetch } = query;

    const thresholdMap = useMemo(() => {
        if (!data) return undefined;

        // Derive the line roles from the lines echoed in the response: with
        // keepPreviousData the visible data can belong to the previous request.
        return buildEndemicThresholdMap(data.entries, getThresholdLineRoles(data.lines));
    }, [data]);

    return {
        thresholdMap,
        ...getThresholdQueryState(isQueryEnabled, query),
        error: isQueryEnabled ? error : null,
        refetch,
    };
};
