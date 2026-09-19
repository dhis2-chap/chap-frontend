import type { ModelSpecRead, ModelTemplateRead } from '@dhis2-chap/ui';

export const datasetSupportsModel = (
    names: string[],
    periodType: string,
    model: ModelSpecRead | ModelTemplateRead,
): boolean => {
    if (model.archived || !periodType) return false;
    const supportedPeriod = model.supportedPeriodType?.toLowerCase();
    if (supportedPeriod && supportedPeriod !== 'any' && supportedPeriod !== periodType.toLowerCase()) return false;
    const required = 'covariates' in model
        ? [...model.covariates.map(covariate => covariate.name), ...(model.additionalContinuousCovariates ?? []), model.target.name]
        : [...(model.requiredCovariates ?? []), model.target ?? 'disease_cases'];
    return required.every(name => name.startsWith('gen:') || names.includes(name));
};
