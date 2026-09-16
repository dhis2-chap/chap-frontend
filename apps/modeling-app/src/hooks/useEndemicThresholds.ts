import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    buildEndemicThresholdMap,
    DatasetsService,
    dedupeSeriesPeriods,
    getSeriesLocations,
    getThresholdLineRoles,
    type PredictionOrgUnitSeries,
    type ThresholdResponse,
} from '@dhis2-chap/ui';
import type { ThresholdParams } from '@/utils/thresholdStrategyParams';
import { getThresholdQueryState, isThresholdQueryEnabled } from '@/utils/thresholdQueryState';

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
    const periodIds = useMemo(() => dedupeSeriesPeriods(series), [series]);
    const locations = useMemo(() => getSeriesLocations(series), [series]);
    const isQueryEnabled = isThresholdQueryEnabled(enabled, datasetId, periodIds);

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
