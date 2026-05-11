import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import {
    ApiError,
    DataBaseResponse,
    ModelsService,
    PredictionSetupCreate,
} from '@dhis2-chap/ui';
import { BACKTESTS_LIST_QUERY_KEY } from '@/hooks/useBacktests';
import { PREDICTION_SETUPS_QUERY_KEY } from '@/hooks/usePredictionSetups';

type CreatePredictionSetupVariables = {
    data: PredictionSetupCreate & {
        metaData?: Record<string, unknown>;
    };
};

type UseCreatePredictionSetupOptions = {
    onSuccess?: (predictionSetup: DataBaseResponse) => void;
    onError?: (error: ApiError) => void;
};

export const useCreatePredictionSetup = ({
    onSuccess,
    onError,
}: UseCreatePredictionSetupOptions = {}) => {
    const queryClient = useQueryClient();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Prediction setup created'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to create prediction setup'),
        { critical: true },
    );

    const mutation = useMutation<
        DataBaseResponse,
        ApiError,
        CreatePredictionSetupVariables
    >({
        mutationFn: ({ data }) =>
            ModelsService.createPredictionSetupV1CrudPredictionSetupsPost(data),
        onSuccess: (predictionSetup, { data }) => {
            queryClient.invalidateQueries({ queryKey: [BACKTESTS_LIST_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [BACKTESTS_LIST_QUERY_KEY, data.backtestId] });
            queryClient.invalidateQueries({ queryKey: [PREDICTION_SETUPS_QUERY_KEY] });
            showSuccessAlert();
            onSuccess?.(predictionSetup);
        },
        onError: (error) => {
            showErrorAlert();
            onError?.(error);
        },
    });

    return {
        createPredictionSetup: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset,
    };
};
