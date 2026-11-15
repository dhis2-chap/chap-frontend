import { useQuery } from '@tanstack/react-query';
import { ApiError, PredictionsService } from '@dhis2-chap/ui';
import { type PredictionInfo } from '@chap-blocks/ui/utils';

export const usePredictions = () => {
    const { data, error, isLoading } = useQuery<PredictionInfo[], ApiError>({
        queryKey: ['predictions'],
        queryFn: () => PredictionsService.getPredictionsV1CrudPredictionsGet(),
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
