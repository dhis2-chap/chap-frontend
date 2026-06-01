import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    ThresholdsService,
    type EndemicThresholdPoint,
    type ThresholdEntry,
} from '@dhis2-chap/ui';

const DEFAULT_STRATEGY = 'seasonal';

type Props = {
    datasetId: number | undefined;
    periodIds: string[];
    locations?: string[];
    strategy?: string;
    enabled?: boolean;
};

export const useEndemicThresholds = ({
    datasetId,
    periodIds,
    locations,
    strategy = DEFAULT_STRATEGY,
    enabled = true,
}: Props) => {
    const isQueryEnabled = enabled && !!datasetId && periodIds.length > 0;

    const { data, isLoading, error } = useQuery<ThresholdEntry[], ApiError>({
        queryKey: ['endemic-thresholds', datasetId, periodIds, locations, strategy],
        queryFn: async () => {
            if (!datasetId) throw new Error('datasetId is required');

            return await ThresholdsService.getThresholdsV1AnalyticsThresholdsPost({
                datasetId,
                periodIds,
                strategy,
                locations,
            });
        },
        enabled: isQueryEnabled,
        staleTime: 300000,
        cacheTime: 300000,
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
        error,
    };
};
