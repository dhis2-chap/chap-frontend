import { useQuery } from '@tanstack/react-query';
import { ApiError, PredictionInfo, PredictionsService } from '@dhis2-chap/ui';

export const usePredictionById = (predictionId: string | undefined) => {
    const { data, error, isLoading, isFetching, isError } = useQuery<PredictionInfo, ApiError>({
        queryKey: ['prediction', predictionId],
        queryFn: () => PredictionsService.getPredictionV1CrudPredictionsPredictionIdGet(predictionId as unknown as number),
        enabled: !!predictionId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        prediction: data,
        error,
        isLoading: isLoading || isFetching,
        isError,
    };
};
