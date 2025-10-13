import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';

import { CrudService } from '@dhis2-chap/ui';
import { useAlert } from '@dhis2/app-runtime';

type Props = {
    onSuccess?: ({ id }: { id: number }) => void;
    onError?: () => void;
};

export const useDeleteModel = ({ onSuccess, onError }: Props = {}) => {
    const queryClient = useQueryClient();
    const { show: showSuccessAlert } = useAlert(
        i18n.t('Model deleted'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to delete model'),
        { critical: true },
    );

    const {
        mutate: deleteModel,
        isPending,
        isError,
        error,
    } = useMutation<{ id: number }, Error, number>({
        mutationFn: (id) => {
            throw new Error('Delete model endpoint not yet implemented in the API');
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: ['models'] });
            showSuccessAlert();
            onSuccess?.({ id });
        },
        onError: (error) => {
            console.error(error);
            showErrorAlert();
            onError?.();
        },
    });

    return {
        deleteModel,
        isPending,
        isError,
        error,
    };
};
