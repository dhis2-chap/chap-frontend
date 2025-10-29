import { useQuery } from '@tanstack/react-query';
import { ApiError, AnalyticsService, PredictionEntry } from '@dhis2-chap/ui';

const STANDARD_QUANTILES = [0.1, 0.5, 0.9];

export const usePredictionEntries = (predictionId: number | undefined) => {
    const { data, error, isLoading, isFetching, isError } = useQuery<PredictionEntry[], ApiError>({
        queryKey: ['predictionEntries', predictionId, STANDARD_QUANTILES],
        queryFn: () => AnalyticsService.getPredictionEntriesAnalyticsPredictionEntryPredictionIdGet(
            predictionId as number,
            STANDARD_QUANTILES,
        ),
        enabled: !!predictionId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        predictionEntries: data ?? [],
        error,
        isLoading: isLoading || isFetching,
        isError,
    };
};
