import type { BacktestSpecificationRead, ReferenceModelResult } from '@dhis2-chap/ui';

export const getReferenceModels = (specification: BacktestSpecificationRead | undefined, includeComparisonModels: boolean) => [
    ...specification?.baselines ?? [],
    ...includeComparisonModels ? specification?.comparisonModels ?? [] : [],
];

// Use the configured baseline by default; never infer a "best" reference from scores.
export const getSelectedReference = (references: ReferenceModelResult[], selectedId: string | undefined, defaultBaseline?: string) => {
    if (selectedId === 'none') return undefined;
    return references.find(reference => String(reference.configuredModel.id) === selectedId)
        ?? references.find(reference => reference.configuredModel.name === defaultBaseline)
        ?? references[0];
};
