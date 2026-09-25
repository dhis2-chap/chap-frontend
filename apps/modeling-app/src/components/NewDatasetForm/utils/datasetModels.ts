import type { ModelSpecRead } from '@dhis2-chap/ui';

/** Every column name a model reads: its covariates, extra continuous covariates and target. */
export const getRequiredCovariates = (model: ModelSpecRead): string[] => [...new Set([
    ...model.covariates.map(covariate => covariate.name),
    ...(model.additionalContinuousCovariates ?? []),
    model.target.name,
])].filter(name => !name.startsWith('gen:'));

const supportsPeriodType = (model: ModelSpecRead, periodType: string) => {
    const supportedPeriodType = model.supportedPeriodType?.toLowerCase();
    return !supportedPeriodType || supportedPeriodType === 'any' || supportedPeriodType === periodType.toLowerCase();
};

/**
 * A model can run on a dataset when the dataset has a column for every covariate the model
 * requires (covariates CHAP generates itself, prefixed `gen:`, are exempt) and their period
 * types agree. Extra columns are fine.
 */
export const datasetSupportsModel = (
    covariateNames: string[],
    periodType: string,
    model: ModelSpecRead,
): boolean => (
    !model.archived &&
    !!periodType &&
    supportsPeriodType(model, periodType) &&
    getRequiredCovariates(model).every(name => covariateNames.includes(name))
);

export type ColumnSuggestion = {
    columns: string[];
    /** Models that become runnable once all these columns are added. */
    models: ModelSpecRead[];
};

export type ModelSupport = {
    supported: ModelSpecRead[];
    /** Models that accept the period type but miss columns, fewest missing first. */
    missingColumns: { model: ModelSpecRead; missing: string[] }[];
    /** Models that cannot run on this period type whatever the columns. */
    wrongPeriodType: ModelSpecRead[];
    /** Sets of columns to add, the ones that make the most models runnable first. */
    nextColumns: ColumnSuggestion[];
};

const MAX_COLUMN_SUGGESTIONS = 3;

export const getModelSupport = (
    covariateNames: string[],
    periodType: string,
    models: ModelSpecRead[],
): ModelSupport => {
    const support: ModelSupport = { supported: [], missingColumns: [], wrongPeriodType: [], nextColumns: [] };

    models.filter(model => !model.archived).forEach((model) => {
        if (!supportsPeriodType(model, periodType)) {
            support.wrongPeriodType.push(model);
            return;
        }
        const missing = getRequiredCovariates(model).filter(name => !covariateNames.includes(name));
        if (missing.length) {
            support.missingColumns.push({ model, missing });
        } else {
            support.supported.push(model);
        }
    });
    support.missingColumns.sort((a, b) => a.missing.length - b.missing.length);

    // Each model's missing columns is a candidate; adding it also unlocks every model missing a subset of it.
    const candidates = new Map<string, string[]>();
    support.missingColumns.forEach(({ missing }) => candidates.set([...missing].sort().join('\n'), missing));
    support.nextColumns = [...candidates.values()]
        .map(columns => ({
            columns,
            models: support.missingColumns
                .filter(({ missing }) => missing.every(name => columns.includes(name)))
                .map(({ model }) => model),
        }))
        .sort((a, b) => b.models.length - a.models.length || a.columns.length - b.columns.length)
        .slice(0, MAX_COLUMN_SUGGESTIONS);

    return support;
};
