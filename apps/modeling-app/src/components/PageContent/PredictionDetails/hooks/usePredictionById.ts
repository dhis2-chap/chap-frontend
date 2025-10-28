import { useQuery } from '@tanstack/react-query';
import { ApiError, CrudService, PredictionRead } from '@dhis2-chap/ui';

export const usePredictionById = (predictionId: string | undefined) => {
    const { data, error, isLoading, isFetching, isError } = useQuery<PredictionRead, ApiError>({
        queryKey: ['prediction', predictionId],
        queryFn: () => CrudService.getPredictionCrudPredictionsPredictionIdGet(predictionId as unknown as number),
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

export default usePredictionById;
