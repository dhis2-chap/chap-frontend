import { ApiError, CrudService } from '@dhis2-chap/ui';
import { useAlert } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';

type Props = {
    onSuccess?: () => void;
    onError?: (error: ApiError) => void;
};

export const useBatchDeleteBacktests = ({
    onSuccess,
    onError,
}: Props = {}) => {
    const queryClient = useQueryClient();

    const { show: showSuccess } = useAlert(
        i18n.t('Evaluations deleted'),
        { success: true },
    );

    const { show: showError } = useAlert(
        i18n.t('Failed to delete evaluations'),
        { critical: true },
    );

    const { mutate: deleteBacktests, isLoading: isSubmitting } = useMutation({
        mutationFn: (backtestIds: number[]) => CrudService.deleteBacktestBatchCrudBacktestsDelete(backtestIds.join(',')),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backtests'] });
            showSuccess();
            onSuccess?.();
        },
        onError: (error) => {
            showError();
            console.error('Failed to delete evaluations', error);
            onError?.(error as ApiError);
        },
    });

    return {
        deleteBacktests,
        isSubmitting,
    };
};
