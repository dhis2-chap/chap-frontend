import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { CrudService, ModelTemplateCreate, ModelTemplateRead } from '@dhis2-chap/ui';
import { useAlert } from '@dhis2/app-runtime';

type Props = {
    onSuccess?: (template: ModelTemplateRead) => void;
    onError?: () => void;
};

export const useAddModelTemplate = ({ onSuccess, onError }: Props = {}) => {
    const queryClient = useQueryClient();
    const { show: showSuccessAlert } = useAlert(
        i18n.t('Model template added'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to add model template'),
        { critical: true },
    );

    const {
        mutate: addModelTemplate,
        isPending,
        isError,
        error,
    } = useMutation<ModelTemplateRead, Error, ModelTemplateCreate>({
        mutationFn: async (data) => {
            return CrudService.addModelTemplateCrudModelTemplatesPost(data);
        },
        onSuccess: (template) => {
            queryClient.invalidateQueries({ queryKey: ['modelTemplates'] });
            showSuccessAlert();
            onSuccess?.(template);
        },
        onError: (error) => {
            console.error(error);
            showErrorAlert();
            onError?.();
        },
    });

    return {
        addModelTemplate,
        isPending,
        isError,
        error,
    };
};
