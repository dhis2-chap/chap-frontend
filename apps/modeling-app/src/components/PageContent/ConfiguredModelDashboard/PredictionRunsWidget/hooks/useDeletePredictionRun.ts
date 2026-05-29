import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { ApiError, PredictionsService } from '@dhis2-chap/ui';
import { PREDICTION_SETUPS_QUERY_KEY } from '@/hooks/usePredictionSetups';

type DeletePredictionRunVariables = {
    predictionId: number;
    predictionSetupId?: number;
};

type UseDeletePredictionRunOptions = {
    onSuccess?: ({ predictionId }: { predictionId: number }) => void;
    onError?: (error: ApiError) => void;
};

export const useDeletePredictionRun = ({
    onSuccess,
    onError,
}: UseDeletePredictionRunOptions = {}) => {
    const queryClient = useQueryClient();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Prediction run deleted'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to delete prediction run'),
        { critical: true },
    );

    const mutation = useMutation<void, ApiError, DeletePredictionRunVariables>({
        mutationFn: async ({ predictionId }) => {
            await PredictionsService.deletePredictionV1CrudPredictionsPredictionIdDelete(
                predictionId,
            );
        },
        onSuccess: async (_, { predictionId, predictionSetupId }) => {
            await queryClient.invalidateQueries({ queryKey: ['predictions'] });
            await queryClient.invalidateQueries({ queryKey: [PREDICTION_SETUPS_QUERY_KEY] });

            if (predictionSetupId !== undefined) {
                await queryClient.invalidateQueries({
                    queryKey: [PREDICTION_SETUPS_QUERY_KEY, predictionSetupId],
                });
            }

            queryClient.removeQueries({ queryKey: ['prediction', String(predictionId)] });
            queryClient.removeQueries({ queryKey: ['prediction', predictionId] });
            showSuccessAlert();
            onSuccess?.({ predictionId });
        },
        onError: (error) => {
            console.error(error);
            showErrorAlert();
            onError?.(error);
        },
    });

    return {
        deletePredictionRun: mutation.mutate,
        isDeleting: mutation.isLoading,
        error: mutation.error,
    };
};
