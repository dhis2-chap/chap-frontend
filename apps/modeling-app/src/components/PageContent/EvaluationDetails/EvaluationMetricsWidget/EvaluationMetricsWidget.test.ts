import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { MetricInfo } from '@dhis2-chap/ui';
import { EvaluationMetricsWidget } from './EvaluationMetricsWidget';
import styles from './EvaluationMetricsWidget.module.css';

vi.mock('@dhis2-chap/ui', () => ({
    Widget: ({ children }: { children: ReactNode }) => children,
    VisualizationsService: {},
}));
vi.mock('@dhis2/ui', () => ({
    Button: ({ children }: { children: ReactNode }) => createElement('button', null, children),
    IconInfo16: () => null,
    Tooltip: ({ content, children }: { content: string; children: ReactNode }) =>
        createElement('span', { title: content }, children),
}));

const renderMetrics = (metrics: Record<string, number>, catalog?: MetricInfo[]) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
    if (catalog) {
        client.setQueryData(['evaluation-metric-catalog', 42], catalog);
    }
    const html = renderToStaticMarkup(createElement(QueryClientProvider, { client },
        createElement(EvaluationMetricsWidget, { evaluationId: 42, metrics }),
    ));
    client.clear();
    return html;
};

describe('EvaluationMetricsWidget metadata', () => {
    it('uses backend names and descriptions for existing and newly registered metrics', () => {
        const html = renderMetrics({ mae: 12 }, [
            { id: 'mae', displayName: 'Backend MAE name', description: 'Updated backend explanation' },
        ]);
        expect(html).toContain('Backend MAE name');
        expect(html).toContain('title="Updated backend explanation"');
        expect(html).toContain('12');

        const newMetric = renderMetrics({ new_backend_metric: 7 }, [
            { id: 'new_backend_metric', displayName: 'New backend metric name', description: 'New explanation' },
        ]);
        expect(newMetric).toContain('New backend metric name');
        expect(newMetric).toContain('title="New explanation"');
    });

    it('keeps scores readable without metadata and omits unavailable tooltips', () => {
        const html = renderMetrics({ unknown_metric: 4 });
        expect(html).toContain('Unknown metric');
        expect(html).toContain('4');
        expect(html).not.toContain('title=');
    });

    it('handles incomplete metadata and only displays metrics with evaluation scores', () => {
        const html = renderMetrics({ unknown_metric: 4 }, [
            { id: 'unknown_metric', displayName: ' ', description: ' ' },
            { id: 'unscored', displayName: 'Unscored metric' },
        ]);
        expect(html).toContain('Unknown metric');
        expect(html).not.toContain('title=');
        expect(html).not.toContain('Unscored metric');
    });

    it('preserves percentage units and coverage targets with backend metadata', () => {
        const html = renderMetrics({ mape: 12, coverage_10_90: 0.8 }, [
            { id: 'mape', displayName: 'Percentage error', unit: '%' },
            { id: 'coverage_10_90', displayName: 'Interval coverage', target: 0.8, targetBehavior: 'at_least' },
        ]);
        expect(html).toContain('12 %');
        expect(html).toContain('target 0.8');
    });

    it('shows zero targets on raw-unit metrics without judging the score against them', () => {
        const html = renderMetrics({ peak_value_diff: -2 }, [
            { id: 'peak_value_diff', displayName: 'Peak difference', unit: 'cases', target: 0, targetBehavior: 'closest' },
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
        ['at_least', 0.6, true],
        ['at_least', 0.65, false],
        ['at_least', 0.8, false],
        ['at_least', 1, false],
        ['closest', 0.6, true],
        ['closest', 0.65, false],
        ['closest', 0.8, false],
        ['closest', 0.95, false],
        ['closest', 1, true],
        [undefined, 1, true],
        ['closest', NaN, false],
        ['at_least', Infinity, false],
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
