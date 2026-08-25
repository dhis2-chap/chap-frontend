import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    DatasetsService,
    type ThresholdStrategyInfo,
} from '@dhis2-chap/ui';

export const useThresholdStrategies = () => {
    const { data, error, isLoading } = useQuery<ThresholdStrategyInfo[], ApiError>({
        queryKey: ['threshold-strategies'],
        queryFn: () => DatasetsService.listThresholdStrategyTypesV1AnalyticsThresholdsStrategiesGet(),
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: 0,
    });

    return {
        thresholdStrategies: data,
        error,
        isLoading,
    };
};
