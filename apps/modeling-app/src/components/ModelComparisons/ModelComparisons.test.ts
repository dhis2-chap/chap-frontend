import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { BacktestSpecificationRead, LeaderboardBacktestRead, MetricInfo, ReferenceModelResult } from '@dhis2-chap/ui';
import { MetricComparison } from './MetricComparison';
import { ReferenceModelSelector } from './ReferenceModelSelector';
import { getComparisonValue, getReferenceModels, getSelectedReference, referenceLabel } from './referenceModels';

vi.mock('@dhis2/ui', () => ({
    Tooltip: ({ content, children }: { content: string; children: ReactNode }) => createElement('span', { title: content }, children),
    SingleSelectField: ({ children, validationText }: { children: ReactNode; validationText?: string }) => createElement('select', { title: validationText }, children),
    SingleSelectOption: ({ value, label }: { value: string; label: string }) => createElement('option', { value }, label),
}));

const baseline = {
    configuredModel: { id: 59, name: 'global_median', configurationDigest: 'baseline', modelTemplate: { name: 'global_median', displayName: 'Global median', version: '1.0' } },
    status: 'done',
    aggregateMetrics: { crps: 8.07 },
} as ReferenceModelResult;
const comparison = { ...baseline, configuredModel: { ...baseline.configuredModel, id: 60, name: 'comparison_model', modelTemplate: { ...baseline.configuredModel.modelTemplate, name: 'comparison_model' } } };
const metric = { id: 'crps', comparisonOp: 'skill_ratio', comparisonDescription: 'Relative improvement over the reference.' } as MetricInfo;
const run = { id: 42, datasetId: 1, modelId: 'model', dataset: { id: 1, name: 'Dataset' }, configuredModel: null, specificationId: 8, aggregateMetrics: { crps: 1.93 }, comparisons: [{ configuredModelId: 59, values: { crps: 0.76 } }] } as LeaderboardBacktestRead;

const render = (props: Partial<Parameters<typeof MetricComparison>[0]>) =>
    renderToStaticMarkup(createElement(MetricComparison, { metricId: 'crps', metric, reference: baseline, run, ...props }));

it('shows a skill ratio as a percentage and other comparisons in the metric units', () => {
    expect(render({})).toContain('title="Relative improvement over Global median. +20% means 20% better than it, -20% means 20% worse."');
    expect(render({})).toContain('+76% vs 8.07');
    expect(render({ metric: { ...metric, comparisonOp: 'difference', unit: 'cases' } })).toContain('+0.76 cases vs 8.07');
});

it('renders nothing without a comparison value', () => {
    expect(render({ run: { ...run, comparisons: [{ configuredModelId: 59, values: { crps: null } }] } })).toBe('');
    expect(render({ run: { ...run, comparisons: [] } })).toBe('');
    expect(render({ reference: comparison })).toBe('');
    expect(render({ reference: undefined })).toBe('');
});

it('explains a baseline that has not produced scores', () => {
    const reference = { ...baseline, status: 'failed', message: 'Not enough history for this model.' } as ReferenceModelResult;
    const html = renderToStaticMarkup(createElement(ReferenceModelSelector, { references: [reference], reference, onSelect: vi.fn() }));
    expect(html).toContain('Global median (Failed)');
    expect(html).toContain('title="Not enough history for this model."');
});

it('selects the configured baseline by default, or another reference with scores', () => {
    const specification = { baselines: [baseline], comparisonModels: [comparison] } as BacktestSpecificationRead;
    const references = getReferenceModels(specification);
    expect(references).toEqual([baseline, comparison]);
    expect(getReferenceModels({} as BacktestSpecificationRead)).toEqual([]);
    expect(getSelectedReference([comparison, baseline], undefined, 'global_median')).toBe(baseline);
    expect(getSelectedReference([{ ...baseline, status: 'pending' } as ReferenceModelResult, comparison], undefined, 'global_median')).toBe(comparison);
    expect(getSelectedReference(references, '60', 'global_median')).toBe(comparison);
    expect(getSelectedReference(references, 'none', 'global_median')).toBeUndefined();
});

it('reads a run\'s comparison value with one reference', () => {
    expect(getComparisonValue(run, baseline, 'crps')).toBe(0.76);
    expect(getComparisonValue(run, baseline, 'mae')).toBeUndefined();
    expect(getComparisonValue(run, comparison, 'crps')).toBeUndefined();
    expect(getComparisonValue({ ...run, comparisons: [{ configuredModelId: 59, values: { crps: null } }] }, baseline, 'crps')).toBeUndefined();
    expect(getComparisonValue(undefined, baseline, 'crps')).toBeUndefined();
    expect(getComparisonValue(run, undefined, 'crps')).toBeUndefined();
});

it('labels a reference by display name and status', () => {
    expect(referenceLabel(baseline)).toBe('Global median');
    expect(referenceLabel({ ...baseline, status: 'pending' } as ReferenceModelResult)).toBe('Global median (Pending)');
});
