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
        i18n.t('Model archived'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to archive model'),
        { critical: true },
    );

    const {
        mutate: deleteModel,
        isPending,
        isError,
        error,
    } = useMutation<void, Error, number>({
        mutationFn: async (id) => {
            await CrudService.deleteConfiguredModelCrudConfiguredModelsConfiguredModelIdDelete(id);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['configuredModels'] });
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
