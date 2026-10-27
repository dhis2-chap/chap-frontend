import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { BacktestSpecificationRead, LeaderboardBacktestRead, MetricInfo, ReferenceModelResult } from '@dhis2-chap/ui';
import { MetricComparison } from './MetricComparison';
import { ReferenceModelSelector } from './ReferenceModelSelector';
import { getReferenceModels, getSelectedReference } from './referenceModels';

vi.mock('@dhis2/ui', () => ({
    IconInfo16: () => null,
    Tooltip: ({ content, children }: { content: string; children: ReactNode }) => createElement('span', { title: content }, children),
    Checkbox: () => null,
    SingleSelectField: ({ children }: { children: ReactNode }) => createElement('select', null, children),
    SingleSelectOption: ({ value, label }: { value: string; label: string }) => createElement('option', { value }, label),
    NoticeBox: ({ title, children }: { title: string; children: ReactNode }) => createElement('aside', null, title, children),
}));

const baseline = {
    configuredModel: { id: 59, name: 'global_median', configurationDigest: 'baseline', modelTemplate: { name: 'global_median', displayName: 'Global median', version: '1.0', description: 'A constant reference.', role: 'baseline' } },
    status: 'done',
    aggregateMetrics: { crps: 8.07 },
} as ReferenceModelResult;
const comparison = { ...baseline, configuredModel: { ...baseline.configuredModel, id: 60, name: 'comparison_model' } };
const metric = { id: 'crps', comparisonOp: 'skill_ratio', comparisonDescription: 'Relative improvement over the reference.' } as MetricInfo;
const run = { id: 42, datasetId: 1, modelId: 'model', dataset: { id: 1, name: 'Dataset' }, specificationId: 8, aggregateMetrics: { crps: 1.93 }, configuredModel: { ...baseline.configuredModel, id: 7 }, comparisons: [{ configuredModelId: 59, values: { crps: 0.76 } }] } as LeaderboardBacktestRead;

const renderComparison = (value: number | null | undefined, info = metric, reference = baseline, modelId = 7) => renderToStaticMarkup(createElement(MetricComparison, {
    metricId: 'crps', metric: info, reference,
    run: { ...run, configuredModel: { ...run.configuredModel!, id: modelId }, comparisons: [{ configuredModelId: 59, values: value === undefined ? {} : { crps: value } }] },
}));

it.each([
    [0.76, 'Improvement +76%'],
    [-0.5, 'Improvement -50%'],
    [0, 'Improvement 0%'],
    [null, 'Comparison undefined'],
    [undefined, 'Comparison unavailable'],
    [NaN, 'Comparison unavailable'],
    [Infinity, 'Comparison unavailable'],
])('renders a skill ratio of %s without inventing a comparison', (value, expected) => {
    const html = renderComparison(value);
    expect(html).toContain('Reference 8.07');
    expect(html).toContain(expected);
    expect(html).toContain('title="Relative improvement over the reference."');
});

it.each(['difference', 'target_distance'])('keeps %s in the metric units', (comparisonOp) => {
    const html = renderComparison(0.2, { ...metric, comparisonOp, unit: 'cases' });
    expect(html).toContain('Reference 8.07 cases');
    expect(html).toContain('Improvement +0.2 cases');
    expect(html).not.toContain('%');
});

it('does not use raw percentage units for a skill ratio', () => {
    expect(renderComparison(0.2, { ...metric, unit: '%' })).toContain('Improvement +20%');
    expect(renderComparison(0.2, { ...metric, unit: '%' })).not.toContain('+20% %');
});

it('identifies the same configured model without implying equal scores across runs', () => {
    const html = renderComparison(undefined, metric, baseline, 59);
    expect(html).toContain('Same model');
    expect(html).not.toContain('Improvement');
});

it('matches comparisons by configured model id, not array position', () => {
    const html = renderToStaticMarkup(createElement(MetricComparison, {
        metricId: 'crps', metric, reference: comparison, run,
    }));
    expect(html).toContain('Comparison unavailable');
    expect(html).not.toContain('+76%');
});

it.each(['pending', 'failed', 'not_applicable'] as const)('shows %s and its reason without displaying scores', (status) => {
    const reference = { ...baseline, status: status as ReferenceModelResult['status'], message: 'Not enough history for this model.' };
    expect(renderComparison(0.76, metric, reference)).toBe('');
    const html = renderToStaticMarkup(createElement(ReferenceModelSelector, {
        references: [reference], reference, onSelect: vi.fn(), includeComparisonModels: false, onIncludeComparisonModels: vi.fn(), loading: false,
    }));
    expect(html).toContain('Not enough history for this model.');
    expect(html).toContain('Global median');
    expect(html).toContain('Version 1.0');
    expect(html).toContain('A constant reference.');
});

it('distinguishes a missing reference score from zero', () => {
    expect(renderComparison(null, metric, { ...baseline, aggregateMetrics: { crps: 0 } })).toContain('Reference 0');
    expect(renderComparison(undefined, metric, { ...baseline, aggregateMetrics: {} })).toContain('Reference Not available');
});

describe('reference selection', () => {
    it('uses the configured default and preserves explicit no-comparison selection', () => {
        expect(getSelectedReference([comparison, baseline], undefined, 'global_median')).toBe(baseline);
        expect(getSelectedReference([baseline, comparison], '60', 'global_median')).toBe(comparison);
        expect(getSelectedReference([baseline], 'none', 'global_median')).toBeUndefined();
    });

    it('removes comparison models immediately when opted out, including cached responses', () => {
        const specification = { baselines: [baseline], comparisonModels: [comparison] } as BacktestSpecificationRead;
        expect(getReferenceModels(specification, true)).toEqual([baseline, comparison]);
        const references = getReferenceModels(specification, false);
        expect(references).toEqual([baseline]);
        expect(getSelectedReference(references, '60', 'global_median')).toBe(baseline);
    });

    it('handles empty and older leaderboard responses', () => {
        expect(getReferenceModels(undefined, false)).toEqual([]);
        expect(getReferenceModels({} as BacktestSpecificationRead, true)).toEqual([]);
        expect(getSelectedReference([], undefined)).toBeUndefined();
    });
});
