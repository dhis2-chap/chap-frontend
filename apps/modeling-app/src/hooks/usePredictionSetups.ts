import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    ModelsService,
    PredictionSetupRead,
} from '@dhis2-chap/ui';

export const PREDICTION_SETUPS_QUERY_KEY = 'predictionSetups' as const;

type UsePredictionSetupsOptions = {
    enabled?: boolean;
};

export const usePredictionSetups = ({
    enabled = true,
}: UsePredictionSetupsOptions = {}) => {
    const { data, error, isLoading } = useQuery<PredictionSetupRead[], ApiError>({
        queryKey: [PREDICTION_SETUPS_QUERY_KEY],
        queryFn: () =>
            ModelsService.listPredictionSetupsV1CrudPredictionSetupsGet(),
        enabled,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        predictionSetups: data,
        error,
        isLoading,
    };
};
