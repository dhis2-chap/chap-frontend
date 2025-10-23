import { useQuery } from '@tanstack/react-query';
import { ApiError, CrudService, PredictionRead } from '@dhis2-chap/ui';

export const usePredictionById = (predictionId: string | undefined) => {
    const numericId = predictionId ? Number(predictionId) : undefined;

    const { data, error, isLoading, isFetching, isError } = useQuery<PredictionRead, ApiError>({
        queryKey: ['prediction', numericId],
        queryFn: () => CrudService.getPredictionCrudPredictionsPredictionIdGet(numericId as number),
        enabled: !!numericId,
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
