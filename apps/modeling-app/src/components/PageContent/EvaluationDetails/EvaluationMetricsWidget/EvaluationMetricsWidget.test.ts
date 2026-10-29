import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { OptimizationDirection, TargetBehavior, type BacktestSpecificationRead, type MetricInfo } from '@dhis2-chap/ui';
import { EvaluationMetricsWidget } from './EvaluationMetricsWidget';
import styles from './EvaluationMetricsWidget.module.css';

vi.mock('@dhis2-chap/ui', () => ({
    Widget: ({ children }: { children: ReactNode }) => children,
    VisualizationsService: {},
    TargetBehavior: { CLOSEST: 'closest', AT_LEAST: 'at_least' },
    OptimizationDirection: { MINIMIZE: 'minimize', MAXIMIZE: 'maximize' },
}));
vi.mock('@dhis2/ui', () => ({
    Button: ({ children }: { children: ReactNode }) => createElement('button', null, children),
    IconInfo16: () => null,
    Checkbox: () => null,
    SingleSelectField: ({ children }: { children: ReactNode }) => createElement('select', null, children),
    SingleSelectOption: ({ value, label }: { value: string; label: string }) => createElement('option', { value }, label),
    NoticeBox: ({ title, children }: { title: string; children: ReactNode }) => createElement('aside', null, title, children),
    Tooltip: ({ content, children }: { content: ReactNode; children: ReactNode }) =>
        createElement('span', null, createElement('span', { role: 'tooltip' }, content), children),
}));

const renderMetrics = (metrics: Record<string, number>, catalog?: Omit<MetricInfo, 'sortOrder' | 'isSelected'>[], specification?: BacktestSpecificationRead) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
    if (catalog) {
        client.setQueryData(['evaluation-metric-catalog', 42], catalog.map(info => ({ ...info })));
    }
    if (specification) {
        client.setQueryData(['backtest-specifications', specification.id, true, true], specification);
    }
    const html = renderToStaticMarkup(createElement(QueryClientProvider, { client },
        createElement(EvaluationMetricsWidget, { evaluationId: 42, metrics, specificationId: specification?.id }),
    ));
    client.clear();
    return html;
};

describe('EvaluationMetricsWidget metadata', () => {
    it('uses backend names and descriptions for existing and newly registered metrics', () => {
        const html = renderMetrics({ mae: 12 }, [
            { id: 'mae', displayName: 'Backend MAE name', description: 'Updated backend explanation', optimizationDirection: OptimizationDirection.MINIMIZE },
        ]);
        expect(html).toContain('Backend MAE name');
        expect(html).toContain('Updated backend explanation');
        expect(html).toContain('Lower is better.');
        expect(html).toContain('12');

        const newMetric = renderMetrics({ new_backend_metric: 7 }, [
            { id: 'new_backend_metric', displayName: 'New backend metric name', description: 'New explanation' },
        ]);
        expect(newMetric).toContain('New backend metric name');
        expect(newMetric).toContain('New explanation');
    });

    it('keeps scores readable without metadata and omits unavailable tooltips', () => {
        const html = renderMetrics({ unknown_metric: 4 });
        expect(html).toContain('Unknown metric');
        expect(html).toContain('4');
        expect(html).not.toContain('role="tooltip"');
    });

    it('handles incomplete metadata and only displays metrics with evaluation scores', () => {
        const html = renderMetrics({ unknown_metric: 4 }, [
            { id: 'unknown_metric', displayName: ' ', description: ' ' },
            { id: 'unscored', displayName: 'Unscored metric' },
        ]);
        expect(html).toContain('Unknown metric');
        expect(html).not.toContain('role="tooltip"');
        expect(html).not.toContain('Unscored metric');
    });

    it('preserves percentage units and coverage targets with backend metadata', () => {
        const html = renderMetrics({ mape: 12, coverage_10_90: 0.8 }, [
            { id: 'mape', displayName: 'Percentage error', unit: '%' },
            { id: 'coverage_10_90', displayName: 'Interval coverage', target: 0.8, targetBehavior: TargetBehavior.AT_LEAST },
        ]);
        expect(html).toContain('12 %');
        expect(html).toContain('target 0.8');
    });

    it('shows zero targets on raw-unit metrics without judging the score against them', () => {
        const html = renderMetrics({ peak_value_diff: -2 }, [
            { id: 'peak_value_diff', displayName: 'Peak difference', unit: 'cases', target: 0, targetBehavior: TargetBehavior.CLOSEST },
        ]);
        expect(html).toContain('-2 cases');
        expect(html).toContain('target 0');
        expect(html).not.toContain(styles.offTarget);
    });

    it.each([undefined, null])('omits units and targets when metadata fields are %s', (missing) => {
        const html = renderMetrics({ mape: 12, coverage_10_90: 0.2 }, [
            { id: 'mape', displayName: 'MAPE', unit: missing },
            { id: 'coverage_10_90', displayName: 'Coverage', target: missing },
        ]);
        expect(html).not.toContain('%');
        expect(html).not.toContain('target ');
        expect(html).not.toContain(styles.offTarget);
    });

    it.each([
        [TargetBehavior.AT_LEAST, 0.6, true],
        [TargetBehavior.AT_LEAST, 0.65, false],
        [TargetBehavior.AT_LEAST, 0.8, false],
        [TargetBehavior.AT_LEAST, 1, false],
        [TargetBehavior.CLOSEST, 0.6, true],
        [TargetBehavior.CLOSEST, 0.65, false],
        [TargetBehavior.CLOSEST, 0.8, false],
        [TargetBehavior.CLOSEST, 0.95, false],
        [TargetBehavior.CLOSEST, 1, true],
        [undefined, 1, true],
        [TargetBehavior.CLOSEST, NaN, false],
        [TargetBehavior.AT_LEAST, Infinity, false],
    ] as const)('judges %s scores of %s against the backend target', (targetBehavior, score, offTarget) => {
        const html = renderMetrics({ custom_metric: score }, [
            { id: 'custom_metric', displayName: 'Custom metric', target: 0.8, targetBehavior },
        ]);
        expect(html.includes(styles.offTarget)).toBe(offTarget);
        if (!Number.isFinite(score)) {
            expect(html).toContain('Not available');
        }
    });
});

it('uses the specification catalog and comparisons for the current evaluation, including archived runs', () => {
    const html = renderMetrics({ crps: 1.93 }, [], {
        id: 8,
        dataset: { id: 1, name: 'Dataset' },
        orgUnits: [],
        defaultBaselineModel: 'global_median',
        metrics: [{ id: 'crps', displayName: 'CRPS from specification', comparisonOp: 'skill_ratio', comparisonDescription: 'Relative improvement.', isSelected: true, sortOrder: 0 }],
        baselines: [{ configuredModel: { id: 59, name: 'global_median', configurationDigest: 'baseline', modelTemplate: { name: 'global_median', version: '1.0', displayName: 'Global median' } }, status: 'done', aggregateMetrics: { crps: 8.07 } }],
        backtests: [
            { id: 99, datasetId: 1, modelId: 'model', dataset: { id: 1, name: 'Dataset' }, specificationId: 8, configuredModel: null, aggregateMetrics: { crps: 12 }, comparisons: [{ configuredModelId: 59, values: { crps: -0.5 } }] },
            { id: 42, datasetId: 1, modelId: 'model', dataset: { id: 1, name: 'Dataset' }, specificationId: 8, configuredModel: null, aggregateMetrics: { crps: 1.93 }, comparisons: [{ configuredModelId: 59, values: { crps: 0.76 } }] },
        ],
    } as BacktestSpecificationRead);
    expect(html).toContain('CRPS from specification');
    expect(html).toContain('Global median');
    expect(html).toContain('+76% vs 8.07');
    expect(html).not.toContain('-50%');
});
