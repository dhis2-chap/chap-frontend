import type { ModelSpecRead } from '@dhis2-chap/ui';

/**
 * A model can run on a dataset when the dataset has a column for every covariate the model
 * requires (covariates CHAP generates itself, prefixed `gen:`, are exempt) and their period
 * types agree. Extra columns are fine.
 */
export const datasetSupportsModel = (
    covariateNames: string[],
    periodType: string,
    model: ModelSpecRead,
): boolean => {
    if (model.archived || !periodType) {
        return false;
    }

    const supportedPeriodType = model.supportedPeriodType?.toLowerCase();
    if (supportedPeriodType && supportedPeriodType !== 'any' && supportedPeriodType !== periodType.toLowerCase()) {
        return false;
    }

    const required = [
        ...model.covariates.map(covariate => covariate.name),
        ...(model.additionalContinuousCovariates ?? []),
        model.target.name,
    ];

    return required.every(name => name.startsWith('gen:') || covariateNames.includes(name));
};
