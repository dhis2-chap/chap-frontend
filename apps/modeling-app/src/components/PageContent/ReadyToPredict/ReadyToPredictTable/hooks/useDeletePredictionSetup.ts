import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { ApiError, ModelsService } from '@dhis2-chap/ui';
import { PREDICTION_SETUPS_QUERY_KEY } from '@/hooks/usePredictionSetups';

type UseDeletePredictionSetupOptions = {
    onSuccess?: ({ predictionSetupId }: { predictionSetupId: number }) => void;
    onError?: (error: ApiError) => void;
};

export const useDeletePredictionSetup = ({
    onSuccess,
    onError,
}: UseDeletePredictionSetupOptions = {}) => {
    const queryClient = useQueryClient();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Prediction setup deleted'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to delete prediction setup'),
        { critical: true },
    );

    const mutation = useMutation<void, ApiError, number>({
        mutationFn: async (predictionSetupId) => {
            await ModelsService.deletePredictionSetupV1CrudPredictionSetupsPredictionSetupIdDelete(
                predictionSetupId,
            );
        },
        onSuccess: async (_, predictionSetupId) => {
            await queryClient.invalidateQueries({ queryKey: [PREDICTION_SETUPS_QUERY_KEY] });
            await queryClient.invalidateQueries({ queryKey: ['predictions'] });
            await queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.removeQueries({
                queryKey: [PREDICTION_SETUPS_QUERY_KEY, predictionSetupId],
            });
            showSuccessAlert();
            onSuccess?.({ predictionSetupId });
        },
        onError: (error) => {
            console.error(error);
            showErrorAlert();
            onError?.(error);
        },
    });

    return {
        deletePredictionSetup: mutation.mutate,
        isDeleting: mutation.isLoading,
        error: mutation.error,
    };
};
