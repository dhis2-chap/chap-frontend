import { useFormContext, useWatch } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { ModelSpecRead } from '@dhis2-chap/ui';
import { ModelExecutionFormValues, CovariateMapping } from '../../hooks/useModelExecutionFormState';

export const useDatasetValidation = () => {
    const queryClient = useQueryClient();
    const methods = useFormContext<ModelExecutionFormValues>();

    const modelId = useWatch({ control: methods.control, name: 'modelId' });
    const covariateMappings = useWatch({ control: methods.control, name: 'covariateMappings' });
    const targetMapping = useWatch({ control: methods.control, name: 'targetMapping' });

    const getSelectedModel = (modelId: string): ModelSpecRead | undefined => {
        if (!modelId) return undefined;

        return queryClient.getQueryData<ModelSpecRead[]>(['models'])?.find(model => model.id === Number(modelId));
    };

    const validateTargetMapping = (modelId: string, targetMapping?: CovariateMapping): string | null => {
        const model = getSelectedModel(modelId);
        if (!model || !model.target) return null;

        if (!targetMapping) {
            return i18n.t('Target "{{targetName}}" must be mapped to a data item', {
                targetName: model.target.displayName || model.target.name,
            });
        }

        if (targetMapping.covariateName !== model.target.name || !targetMapping.dataItem.id) {
            return i18n.t('Target "{{targetName}}" must be mapped to a data item', {
                targetName: model.target.displayName || model.target.name,
            });
        }

        return null;
    };

    const validateCovariateMapping = (modelId: string, covariateMappings?: CovariateMapping[]): Record<string, string> => {
        const model = getSelectedModel(modelId);
        const errors: Record<string, string> = {};

        if (!model || !model.covariates) return errors;

        model.covariates.forEach((covariate) => {
            if (!covariate.name) return; // Skip covariates without a name

            const mapping = covariateMappings?.find(m => m.covariateName === covariate.name);

            if (!mapping || !mapping.dataItem.id) {
                errors[covariate.name] = i18n.t('Covariate "{{covariateName}}" must be mapped to a data item', {
                    covariateName: covariate.displayName || covariate.name,
                });
            }
        });

        return errors;
    };

    const getMissingMappings = (modelId: string, covariateMappings?: CovariateMapping[], targetMapping?: CovariateMapping) => {
        const model = getSelectedModel(modelId);
        if (!model) return { missingCovariates: [], missingTarget: true };

        const missingCovariates = model.covariates?.filter(covariate =>
            !covariateMappings?.some(mapping =>
                mapping.covariateName === covariate.name && mapping.dataItem.id,
            ),
        ) || [];

        const missingTarget = !targetMapping
            || !model.target
            || targetMapping.covariateName !== model.target.name
            || !targetMapping.dataItem.id;

        return { missingCovariates, missingTarget };
    };

    const getDetailedValidationSummary = () => {
        if (!modelId) {
            return {
                isValid: false,
                hasMissingMappings: false,
                missingCovariates: [],
                missingTarget: false,
                totalCovariates: 0,
                mappedCovariates: 0,
            };
        }

        const model = getSelectedModel(modelId);
        if (!model) {
            return {
                isValid: false,
                hasMissingMappings: true,
                missingCovariates: [],
                missingTarget: true,
                totalCovariates: 0,
                mappedCovariates: 0,
            };
        }

        const { missingCovariates, missingTarget } = getMissingMappings(
            modelId,
            covariateMappings,
            targetMapping,
        );

        const totalCovariates = model.covariates?.length || 0;
        const mappedCovariates = totalCovariates - missingCovariates.length;
        const hasMissingMappings = missingCovariates.length > 0 || missingTarget;

        return {
            isValid: !hasMissingMappings,
            hasMissingMappings,
            missingCovariates,
            missingTarget,
            totalCovariates,
            mappedCovariates,
        };
    };

    return {
        getSelectedModel,
        validateTargetMapping,
        validateCovariateMapping,
        getMissingMappings,
        getDetailedValidationSummary,
    };
};
