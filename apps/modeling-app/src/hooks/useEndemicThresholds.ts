import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    buildEndemicThresholdMap,
    DatasetsService,
    getSeriesPeriods,
    type PredictionOrgUnitSeries,
    type ThresholdResponse,
} from '@dhis2-chap/ui';
import {
    getThresholdLineRoles,
    type ThresholdParams,
} from '@/utils/thresholdStrategyParams';

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
    // Request thresholds for exactly the periods the charts display.
    const periodIds = useMemo(() => Array.from(new Set(
        series.flatMap(getSeriesPeriods),
    )), [series]);
    const locations = useMemo(() => (
        series.map(orgUnitSeries => orgUnitSeries.orgUnitId)
    ), [series]);
    const isQueryEnabled = enabled && !!datasetId && periodIds.length > 0;

    const { data, isFetching, error, refetch } = useQuery<ThresholdResponse, ApiError>({
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

    const thresholdMap = useMemo(() => {
        if (!data) return undefined;

        // Derive the line roles from the params echoed in the response: with
        // keepPreviousData the visible data can belong to the previous request.
        return buildEndemicThresholdMap(data.entries, getThresholdLineRoles(data.params));
    }, [data]);

    return {
        thresholdMap,
        // isFetching also covers refetches after an error and background
        // recalculations over kept previous data, unlike isLoading.
        isLoading: isQueryEnabled && isFetching,
        error: isQueryEnabled ? error : null,
        refetch,
    };
};
