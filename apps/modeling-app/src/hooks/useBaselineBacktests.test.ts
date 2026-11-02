import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { BacktestsService, type BacktestRead, type BacktestSpecificationRead, type ReferenceModelResult } from '@dhis2-chap/ui';
import { useSelectedEvaluationsController } from '../features/evaluation-compare/useSearchParamSelections';
import { EvaluationCompatibleSelector } from '../features/select-evaluation/EvaluationSelector';

vi.mock('@dhis2-chap/ui', () => ({
    BacktestsService: {
        getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet: vi.fn(),
        getBacktestInfoV1CrudBacktestsBacktestIdInfoGet: vi.fn(),
    },
}));
vi.mock('@dhis2/ui', () => ({
    SingleSelect: ({ children, selected }: { children: ReactNode; selected: string }) => createElement('select', { value: selected, onChange: () => {} }, children),
    SingleSelectOption: ({ value, label }: { value: string; label: string }) => createElement('option', { value }, label),
    Help: ({ children }: { children: ReactNode }) => createElement('aside', null, children),
}));

const base = { id: 1, specificationId: 10, name: 'Base evaluation' } as BacktestRead;
const other = { id: 2, specificationId: 20, name: 'Other evaluation' } as BacktestRead;
const baseline = { id: 3, specificationId: 10, name: 'Internal baseline name', orgUnits: ['org-unit'], splitPeriods: ['202601'] } as BacktestRead;
const reference = (status: `${ReferenceModelResult['status']}`, backtestId?: number) => ({
    status,
    backtestId,
    configuredModel: { id: 9, name: 'global_median', configurationDigest: '', modelTemplate: { name: 'global_median', displayName: 'Global median', version: '1.0' } },
} as ReferenceModelResult);
const specification = { id: 10, baselines: [reference('done', 3), reference('pending', 4), reference('failed', 5), reference('not_applicable', 6), reference('done')] } as BacktestSpecificationRead;
const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: Infinity } } });

afterEach(() => {
    client.clear();
    vi.resetAllMocks();
});

const renderComparison = (baseId = 1, comparisonId = 3) => {
    let selection: ReturnType<typeof useSelectedEvaluationsController>;
    const Compare = () => {
        selection = useSelectedEvaluationsController();
        return createElement(EvaluationCompatibleSelector, {
            selected: selection.comparisonEvaluation,
            compatibleEvaluationId: selection.baseEvaluation?.id,
            specificationId: selection.baseEvaluation?.specificationId,
            onSelect: () => {},
        });
    };
    const html = renderToStaticMarkup(createElement(QueryClientProvider, { client },
        createElement(StaticRouter, { location: `/?baseEvaluation=${baseId}&comparisonEvaluation=${comparisonId}` }, createElement(Compare)),
    ));
    return { html, selection: selection! };
};

const loadBaselines = async () => {
    client.setQueryData(['backtests'], [base, other]);
    client.setQueryData(['backtests', 'compatible', 1], [other]);
    vi.mocked(BacktestsService.getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet).mockResolvedValue(specification);
    vi.mocked(BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet).mockResolvedValue(baseline);
    renderComparison();
    // Static rendering registers the real queries; fetch them explicitly without a browser.
    await client.getQueryCache().find(['backtest-specifications', 10, false, false])!.fetch();
    renderComparison();
    const queries = client.getQueryCache().findAll({ predicate: query => query.queryKey[0] === 'backtests' && typeof query.queryKey[1] === 'number' });
    await Promise.all(queries.map(query => query.fetch()));
};

it('fetches only completed baselines, appends their labels and resolves a baseline URL', async () => {
    await loadBaselines();
    const { html, selection } = renderComparison();

    expect(BacktestsService.getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet).toHaveBeenCalledWith(10, false, false);
    expect(BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet).toHaveBeenCalledExactlyOnceWith(3);
    expect(html).toContain('<option value="2">Other evaluation</option><option value="3" selected="">Global median (baseline)</option>');
    expect(selection.comparisonEvaluation).toEqual({ ...baseline, name: 'Global median (baseline)' });
    expect(selection.evaluations).toEqual([base, other]);
});

it('keeps ordinary comparisons available if baseline loading fails', async () => {
    await loadBaselines();
    client.removeQueries({ queryKey: ['backtests', 3], exact: true });
    vi.mocked(BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet).mockRejectedValue(new Error('Baseline unavailable'));
    renderComparison(1, 2);
    await expect(client.getQueryCache().find(['backtests', 3])!.fetch()).rejects.toThrow('Baseline unavailable');

    const { html, selection } = renderComparison(1, 2);
    expect(html).toContain('Baseline unavailable');
    expect(html).toContain('<option value="2" selected="">Other evaluation</option>');
    expect(selection.comparisonEvaluation).toEqual(other);
});
