import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    DatasetsService,
    type EndemicThresholdPoint,
    type PredictionOrgUnitSeries,
    type ThresholdEntry,
} from '@dhis2-chap/ui';

export const DEFAULT_THRESHOLD_STRATEGY = 'seasonal';

type Props = {
    datasetId: number | undefined;
    series: PredictionOrgUnitSeries[];
    strategy?: string;
    enabled?: boolean;
};

export const useEndemicThresholds = ({
    datasetId,
    series,
    strategy = DEFAULT_THRESHOLD_STRATEGY,
    enabled = true,
}: Props) => {
    const periodIds = useMemo(() => Array.from(new Set(
        series.flatMap(orgUnitSeries => orgUnitSeries.points.map(point => point.period)),
    )), [series]);
    const locations = useMemo(() => (
        series.map(orgUnitSeries => orgUnitSeries.orgUnitId)
    ), [series]);
    const isQueryEnabled = enabled && !!datasetId && periodIds.length > 0;

    const { data, isLoading, error } = useQuery<ThresholdEntry[], ApiError>({
        queryKey: ['endemic-thresholds', datasetId, periodIds, locations, strategy],
        queryFn: async () => {
            if (!datasetId) throw new Error('datasetId is required');

            return await DatasetsService.computeThresholdsV1AnalyticsThresholdsPost({
                datasetId,
                periodIds,
                strategy,
                locations,
            });
        },
        enabled: isQueryEnabled,
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: 0,
    });

    const thresholdMap = useMemo(() => {
        if (!data) return undefined;

        const map = new Map<string, EndemicThresholdPoint[]>();

        for (const entry of data) {
            const existing = map.get(entry.location) ?? [];
            existing.push({ period: entry.period, value: entry.value });
            map.set(entry.location, existing);
        }

        return map;
    }, [data]);

    return {
        thresholdMap,
        isLoading: isQueryEnabled && isLoading,
        error: isQueryEnabled ? error : null,
    };
};
