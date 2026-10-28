import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import type { BacktestSpecificationRead, LeaderboardBacktestRead, ReferenceModelResult, SpecificationBaselineStatus } from '@dhis2-chap/ui';

export const statusLabel = (status: SpecificationBaselineStatus) => ({
    done: i18n.t('Done'),
    pending: i18n.t('Pending'),
    not_applicable: i18n.t('Not applicable'),
    failed: i18n.t('Failed'),
})[status];

export const referenceName = ({ configuredModel }: ReferenceModelResult) => configuredModel.modelTemplate.displayName || configuredModel.name;

export const referenceLabel = (reference: ReferenceModelResult) => reference.status === 'done'
    ? referenceName(reference)
    : i18n.t('{{name}} ({{status}})', { name: referenceName(reference), status: statusLabel(reference.status) });

/* Chap Core only compares a run with references that are done and are not the run's own model, so a missing comparison means none. */
export const getComparison = (run: LeaderboardBacktestRead | undefined, reference: ReferenceModelResult | undefined) =>
    reference && run?.comparisons?.find(comparison => comparison.configuredModelId === reference.configuredModel.id)?.values;

export const getComparisonValue = (run: LeaderboardBacktestRead | undefined, reference: ReferenceModelResult | undefined, metricId: string) => {
    const value = getComparison(run, reference)?.[metricId];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

export const getReferenceModels = (specification?: BacktestSpecificationRead) => [
    ...specification?.baselines ?? [],
    ...specification?.comparisonModels ?? [],
];

/* Prefer the configured baseline, which the setting names by template (a configured model is named "template:configuration" unless it is the default configuration).
   A reference without scores is only selected when none has any. Never infer a "best" reference from scores. */
export const getSelectedReference = (references: ReferenceModelResult[], selectedId: string | undefined, defaultBaseline?: string) => {
    if (selectedId === 'none') return undefined;
    const scored = references.filter(reference => reference.status === 'done');
    return references.find(reference => String(reference.configuredModel.id) === selectedId)
        ?? scored.find(reference => reference.configuredModel.modelTemplate.name === defaultBaseline)
        ?? scored[0]
        ?? references[0];
};

export const useReferenceModel = (specification?: BacktestSpecificationRead) => {
    const [selectedId, setSelectedId] = useState<string>();
    const references = getReferenceModels(specification);
    const reference = getSelectedReference(references, selectedId, specification?.defaultBaselineModel);
    return { references, reference, select: setSelectedId };
};
