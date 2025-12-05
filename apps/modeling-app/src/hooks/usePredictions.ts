import { useQuery } from '@tanstack/react-query';
import { CrudService, ApiError, type PredictionInfo } from '@dhis2-chap/ui';

export const usePredictions = () => {
    const { data, error, isLoading } = useQuery<PredictionInfo[], ApiError>({
        queryKey: ['predictions'],
        queryFn: () => CrudService.getPredictionsCrudPredictionsGet(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        predictions: data,
        error,
        isLoading,
    };
};
