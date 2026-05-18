import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    ModelsService,
    PredictionSetupReadWithPredictions,
} from '@dhis2-chap/ui';
import { PREDICTION_SETUPS_QUERY_KEY } from './usePredictionSetups';

export const usePredictionSetup = (predictionSetupId: string | number | undefined) => {
    const parsedPredictionSetupId = Number(predictionSetupId);
    const hasValidPredictionSetupId = Number.isFinite(parsedPredictionSetupId);

    const { data, error, isLoading, isFetching, isError } = useQuery<
        PredictionSetupReadWithPredictions,
        ApiError
    >({
        queryKey: [
            PREDICTION_SETUPS_QUERY_KEY,
            parsedPredictionSetupId,
        ],
        queryFn: () =>
            ModelsService.getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet(
                parsedPredictionSetupId,
            ),
        enabled: hasValidPredictionSetupId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        predictionSetup: data,
        error,
        hasValidPredictionSetupId,
        isLoading: isLoading || isFetching,
        isError,
    };
};
