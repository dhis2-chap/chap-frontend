import i18n from '@dhis2/d2-i18n';
import { useMutation } from '@tanstack/react-query';
import { CrudService } from '@dhis2-chap/ui';
import { ModelTemplateConfigFormValues } from '../components/ModelTemplateConfigForm/ModelTemplateConfigForm';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '@dhis2/app-runtime';

export const useConfigureModelTemplate = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { show } = useAlert(
        i18n.t('Model configured'),
        { success: true },
    );

    const { show: showError } = useAlert(
        i18n.t('Failed to configure model'),
        { error: true },
    );

    return useMutation({
        mutationFn: (modelTemplate: ModelTemplateConfigFormValues) => CrudService.addConfiguredModelCrudConfiguredModelsPost({
            modelTemplateId: modelTemplate.templateId,
            name: modelTemplate.name,
            additionalContinuousCovariates: modelTemplate.covariates.map(covariate => covariate.name),
            userOptionValues: modelTemplate.userOptions,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['models'] });
            navigate('/settings');
            show();
        },
        onError: (error) => {
            console.error(error);
            showError();
        },
    });
};
