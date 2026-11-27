import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import type { BacktestSpecificationRead, MetricInfo } from '@dhis2-chap/ui';
import { SelectionBiasSummary } from './SelectionBiasSummary';
import { useSelectionBias, type SelectionBiasResult } from './useSelectionBias';

vi.mock('./useSelectionBias', () => ({ useSelectionBias: vi.fn() }));

const metric = { id: 'crps_log1p', displayName: 'CRPS (log)', comparisonOp: 'skill_ratio' } as MetricInfo;
const specification = {
    id: 8,
    metrics: [metric, { id: 'coverage_10_90', displayName: 'Coverage' }],
    baselines: [{ configuredModel: { id: 59, name: 'seasonal_shift_persistence', modelTemplate: { name: 'seasonal_shift_persistence', displayName: 'Seasonal shift persistence' } }, status: 'done' }],
    backtests: [
        { id: 7, modelId: 'auto_regressive_monthly', configuredModel: { id: 3 } },
        { id: 6, modelId: 'chap_ewars_monthly', configuredModel: { id: 1 } },
    ],
} as BacktestSpecificationRead;

const bias: SelectionBiasResult = {
    metricId: 'crps_log1p',
    baselineModel: 'seasonal_shift_persistence',
    comparisonDescription: '',
    horizonDistances: [1, 2, 3],
    gapSplits: 2,
    splitPeriods: [],
    candidates: [
        { backtestId: 7, configuredModelId: 3, modelName: 'auto_regressive_monthly', validationValue: 0.122, nDrawsPicked: 1200 },
        { backtestId: 6, configuredModelId: 1, modelName: 'chap_ewars_monthly:weekly', validationValue: 0.08, nDrawsPicked: 300 },
    ],
    selectedBacktestId: 7,
    validationValue: 0.122,
    estimatedBias: 0.0122,
    estimatedValue: 0.1098,
    blockSize: 3,
    nDraws: 2000,
    nDrawsScored: 1500,
    isFirstHorizonOnly: false,
};

const query = (result: { data?: SelectionBiasResult; error?: unknown }) => vi.mocked(useSelectionBias).mockReturnValue(result as ReturnType<typeof useSelectionBias>);
const render = (props: Partial<Parameters<typeof SelectionBiasSummary>[0]> = {}) =>
    renderToStaticMarkup(createElement(SelectionBiasSummary, { specification, metric, ...props }));
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

beforeEach(() => {
    vi.mocked(useSelectionBias).mockReset();
});

it('says how often the best model came out best, and what to expect of it on new data', () => {
    query({ data: bias });
    const html = render({ getModelName: backtestId => (backtestId === 7 ? 'Auto-regressive' : undefined) });
    expect(html).toContain('Auto-regressive came out best in 1,200 of 1,500 redraws of the evaluation, so part of its lead may be luck.');
    expect(text(html)).toContain('Auto-regressive 80% chap_ewars_monthly [weekly] 20%');
    expect(text(html)).toContain('Compared with Seasonal shift persistence in the evaluation +12.2% Expected on new data +11%');
    expect(html).toContain('Forecasts 1 to 3 periods ahead were checked.');
    expect(html).not.toContain('Even the best model');
});

it('says when another model came out best more often, and when only forecasts one period ahead were checked', () => {
    const [best, other] = bias.candidates;
    query({ data: { ...bias, candidates: [{ ...best, nDrawsPicked: 600 }, { ...other, nDrawsPicked: 900 }], horizonDistances: [1], isFirstHorizonOnly: true } });
    const html = render();
    expect(text(html)).toContain('Forecasts one period ahead: auto_regressive_monthly has the best score, but chap_ewars_monthly [weekly] came out best more often in redraws of the evaluation (900 against 600 of 1,500), so the lead of auto_regressive_monthly may be luck.');
    // The model that comes out best most often is listed first.
    expect(text(html)).toContain('chap_ewars_monthly [weekly] 60% auto_regressive_monthly 40%');
    expect(html).not.toContain('periods ahead were checked');
});

it('says the lead is not luck when the same model came out best every time, and warns when even it is behind the baseline', () => {
    const [best, other] = bias.candidates;
    query({ data: { ...bias, candidates: [{ ...best, nDrawsPicked: 1500 }, { ...other, nDrawsPicked: 0 }], validationValue: -0.32, estimatedBias: 0, estimatedValue: -0.32 } });
    const html = render();
    expect(html).toContain('auto_regressive_monthly came out best in every one of 1,500 redraws of the evaluation, so its lead is not luck.');
    expect(html).toMatch(/class="[^"]*worse[^"]*">-32%/);
    expect(html).toContain('Even the best model is expected to do worse than Seasonal shift persistence on new data.');
});

it('never rounds a share to 0% or 100% when it is neither', () => {
    const [best, other] = bias.candidates;
    query({ data: { ...bias, candidates: [{ ...best, nDrawsPicked: 1499 }, { ...other, nDrawsPicked: 1 }] } });
    expect(text(render())).toContain('auto_regressive_monthly &gt;99% chap_ewars_monthly [weekly] &lt;1%');
});

it('gives the reason when Chap Core cannot check it', () => {
    query({ error: { status: 422, body: { detail: 'Too few split points (3)' } } });
    expect(text(render())).toContain('Not checked: Too few split points (3)');
});

it('renders nothing until there is an answer, and does not count a model evaluated twice as two', () => {
    query({});
    const [run] = specification.backtests;
    expect(render({ specification: { ...specification, backtests: [run, { ...run, id: 9 }] } })).toBe('');
    expect(useSelectionBias).toHaveBeenLastCalledWith(8, 'crps_log1p', 1);
    render({ metric: { ...metric, comparisonOp: null } });
    // A metric that cannot be compared with a baseline leaves the choice to Chap Core.
    expect(useSelectionBias).toHaveBeenLastCalledWith(8, undefined, 2);
});
