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

it('says what the best model scored, how much of it is luck and what to expect on new data', () => {
    query({ data: bias });
    const html = render({ getModelName: backtestId => (backtestId === 7 ? 'Auto-regressive' : undefined) });
    expect(text(html)).toContain('Best model Auto-regressive In the evaluation +12.2% Estimated bias +1.22% Expected on new data +11%');
    expect(html).toContain('CRPS (log) compared with Seasonal shift persistence, where positive is better.');
    expect(html).toContain('Chap drew the evaluation splits again 1,500 times, and another model came out best in 300 of the draws.');
    expect(html).toContain('Scored on forecasts 1 to 3 periods ahead.');
    expect(html).toContain('A split left out of a draw only counts when it forecasts no period that a drawn split also forecasts.');
});

it('says when only forecasts one period ahead could be scored', () => {
    query({ data: { ...bias, horizonDistances: [1], gapSplits: 0, isFirstHorizonOnly: true } });
    const html = render();
    expect(text(html)).toContain('Best model one period ahead auto_regressive_monthly In the evaluation');
    expect(html).toContain('Only forecasts one period ahead were scored');
    expect(html).not.toContain('Scored on forecasts');
    expect(html).not.toContain('A split left out of a draw');
});

it('has no bias to report when the same model comes out best in every draw', () => {
    const [best, other] = bias.candidates;
    query({ data: { ...bias, candidates: [{ ...best, nDrawsPicked: 1500 }, { ...other, nDrawsPicked: 0 }], estimatedBias: 0, estimatedValue: 0.122 } });
    const html = render();
    expect(text(html)).toContain('Estimated bias 0% Expected on new data +12.2%');
    expect(html).toContain('the same model came out best every time.');
});

it('falls back to the name Chap Core gives the model, and colours a model that is behind the baseline', () => {
    query({ data: { ...bias, selectedBacktestId: 6, validationValue: -0.32, estimatedBias: 0.02, estimatedValue: -0.34 } });
    const html = render();
    expect(text(html)).toContain('Best model chap_ewars_monthly [weekly] In the evaluation -32%');
    expect(html).toMatch(/class="[^"]*worse[^"]*">-34%/);
});

it('gives the reason when Chap Core cannot estimate it', () => {
    query({ error: { status: 422, body: { detail: 'Too few split points (3)' } } });
    expect(text(render())).toContain('Selection bias Not estimated: Too few split points (3)');
});

it('renders nothing until there is an estimate, and does not count a model evaluated twice as two', () => {
    query({});
    const [run] = specification.backtests;
    expect(render({ specification: { ...specification, backtests: [run, { ...run, id: 9 }] } })).toBe('');
    expect(useSelectionBias).toHaveBeenLastCalledWith(8, 'crps_log1p', 1);
    render({ metric: { ...metric, comparisonOp: null } });
    // A metric that cannot be compared with a baseline leaves the choice to Chap Core.
    expect(useSelectionBias).toHaveBeenLastCalledWith(8, undefined, 2);
});
