import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { useAlert } from '@dhis2/app-runtime';
import {
    ApiError,
    CrudService,
    ModelTemplateRead,
    Body_upload_model_template_crud_model_templates_upload_post,
} from '@dhis2-chap/ui';

type UseUploadModelTemplateOptions = {
    onSuccess?: (template: ModelTemplateRead) => void;
    onError?: (error: ApiError) => void;
};

export const useUploadModelTemplate = ({ onSuccess, onError }: UseUploadModelTemplateOptions = {}) => {
    const queryClient = useQueryClient();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Model template uploaded successfully'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to upload model template'),
        { critical: true },
    );

    const mutation = useMutation<ModelTemplateRead, ApiError, Body_upload_model_template_crud_model_templates_upload_post>({
        mutationFn: formData => CrudService.uploadModelTemplateCrudModelTemplatesUploadPost(formData),
        onSuccess: (template) => {
            queryClient.invalidateQueries({ queryKey: ['modelTemplates'] });
            showSuccessAlert();
            onSuccess?.(template);
        },
        onError: (error) => {
            showErrorAlert();
            onError?.(error);
        },
    });

    return {
        uploadTemplate: mutation.mutateAsync,
        isUploading: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset,
    };
};
