import { describe, expect, it, vi } from 'vitest';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import {
    buildPredictionSeries,
    createHighChartsData,
    createQuantileFunc,
    joinRealAndPredictedData,
    type BacktestRead,
    type DataElement,
    type EvaluationEntry,
    type HighChartsData,
    type PredictionEntry,
} from '@dhis2-chap/ui';
import { plotResultToViewData } from './evaluationPlotData';

// The real barrel pulls in @dhis2/ui, which cannot load in the node test
// environment; re-export the pure transform modules under test instead.
vi.mock('@dhis2-chap/ui', async () => ({
    ...(await import('../../../../packages/ui/src/utils/EvaluationResponse')),
    ...(await import('../../../../packages/ui/src/utils/plotDataForEvaluations')),
    ...(await import('../../../../packages/ui/src/utils/PredictionViewModel')),
}));

const STANDARD_QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9];

const createEvaluationEntry = (
    overrides: Partial<EvaluationEntry> = {},
): EvaluationEntry => ({
    orgUnit: 'adm0',
    period: '2024W1',
    quantile: 0.5,
    splitPeriod: '2024W1',
    value: 1,
    ...overrides,
});

const createQuantileEntries = (
    period: string,
    overrides: Partial<EvaluationEntry> = {},
): EvaluationEntry[] => [
    createEvaluationEntry({ period, quantile: 0.1, value: 10, ...overrides }),
    createEvaluationEntry({ period, quantile: 0.25, value: 20, ...overrides }),
    createEvaluationEntry({ period, quantile: 0.5, value: 30, ...overrides }),
    createEvaluationEntry({ period, quantile: 0.75, value: 40, ...overrides }),
    createEvaluationEntry({ period, quantile: 0.9, value: 50, ...overrides }),
];

const createBacktest = (periodType?: string | null): BacktestRead => ({
    aggregateMetrics: {},
    configuredModel: null,
    dataset: {
        id: 1,
        name: 'Dataset',
        periodType,
    },
    datasetId: 1,
    id: 1,
    modelId: 'model',
    name: 'evaluation',
});

const createActualCase = (
    period: string,
    overrides: Partial<DataElement> = {},
): DataElement => ({
    ou: 'adm0',
    pe: period,
    value: 1,
    ...overrides,
});

const createPredictionEntry = (
    overrides: Partial<PredictionEntry> = {},
): PredictionEntry => ({
    orgUnit: 'adm0',
    period: '2024W1',
    quantile: 0.5,
    value: 1,
    ...overrides,
});

describe('createQuantileFunc', () => {
    it('maps every band of the standard five-quantile set', () => {
        const quantileFunc = createQuantileFunc(STANDARD_QUANTILES);

        const entry = (quantile: number) =>
            createEvaluationEntry({ quantile });

        expect(quantileFunc(entry(0.1))).toBe('quantile_low');
        expect(quantileFunc(entry(0.25))).toBe('quantile_mid_low');
        expect(quantileFunc(entry(0.5))).toBe('median');
        expect(quantileFunc(entry(0.75))).toBe('quantile_mid_high');
        expect(quantileFunc(entry(0.9))).toBe('quantile_high');
    });

    it('derives the outer bands from the first and last requested quantiles', () => {
        const quantileFunc = createQuantileFunc([0.2, 0.5, 0.8]);
        const entry = (quantile: number) =>
            createEvaluationEntry({ quantile });

        expect(quantileFunc(entry(0.2))).toBe('quantile_low');
        expect(quantileFunc(entry(0.8))).toBe('quantile_high');
        expect(quantileFunc(entry(0.5))).toBe('median');
    });

    it('labels quantiles outside the requested set as unknown', () => {
        const quantileFunc = createQuantileFunc(STANDARD_QUANTILES);

        expect(quantileFunc(createEvaluationEntry({ quantile: 0.05 })))
            .toBe('unknown');
        expect(quantileFunc(createEvaluationEntry({ quantile: 0.95 })))
            .toBe('unknown');
    });

    it('falls back to the lowest band when only one quantile is present', () => {
        const quantileFunc = createQuantileFunc([0.5]);

        expect(quantileFunc(createEvaluationEntry({ quantile: 0.5 })))
            .toBe('quantile_low');
    });

    it('still resolves the median when only the outer quantiles are requested', () => {
        const quantileFunc = createQuantileFunc([0.1, 0.9]);

        expect(quantileFunc(createEvaluationEntry({ quantile: 0.5 })))
            .toBe('median');
    });
});

describe('createHighChartsData', () => {
    it('builds ranges, midranges and averages per period for a mixed five-quantile set', () => {
        const data = createHighChartsData(
            [
                ...createQuantileEntries('2024W10'),
                ...createQuantileEntries('2024W2'),
            ],
            createQuantileFunc(STANDARD_QUANTILES),
        );

        expect(data.periods).toEqual(['2024W2', '2024W10']);
        expect(data.ranges).toEqual([
            [10, 50],
            [10, 50],
        ]);
        expect(data.midranges).toEqual([
            [20, 40],
            [20, 40],
        ]);
        expect(data.averages).toEqual([[30], [30]]);
    });

    it('defaults missing bands to zero', () => {
        const data = createHighChartsData(
            [createEvaluationEntry({ quantile: 0.5, value: 7 })],
            createQuantileFunc(STANDARD_QUANTILES),
        );

        expect(data.periods).toEqual(['2024W1']);
        expect(data.averages).toEqual([[7]]);
        expect(data.ranges).toEqual([[0, 0]]);
        expect(data.midranges).toEqual([[0, 0]]);
    });

    it('drops values the quantile function labels as unknown', () => {
        const data = createHighChartsData(
            [
                createEvaluationEntry({ quantile: 0.05, value: 99 }),
                createEvaluationEntry({ quantile: 0.5, value: 7 }),
            ],
            createQuantileFunc(STANDARD_QUANTILES),
        );

        expect(data.periods).toEqual(['2024W1']);
        expect(data.averages).toEqual([[7]]);
        expect(data.ranges).toEqual([[0, 0]]);
    });
});

describe('joinRealAndPredictedData', () => {
    const predicted: HighChartsData = {
        periods: ['202403', '202404'],
        averages: [[30], [31]],
        ranges: [[10, 50], [11, 51]],
        midranges: [[20, 40], [21, 41]],
    };

    it('joins predicted series onto the real-case period axis', () => {
        const joined = joinRealAndPredictedData(predicted, [
            createActualCase('202403', { value: 35 }),
            createActualCase('202404', { value: 36 }),
        ]);

        expect(joined.periods).toEqual(['202403', '202404']);
        expect(joined.averages).toEqual([[30], [31]]);
        expect(joined.ranges).toEqual([
            [10, 50],
            [11, 51],
        ]);
        expect(joined.midranges).toEqual([
            [20, 40],
            [21, 41],
        ]);
        expect(joined.realValues).toEqual([35, 36]);
    });

    it('null-fills predictions on real periods that have no prediction', () => {
        const joined = joinRealAndPredictedData(predicted, [
            createActualCase('202402', { value: 34 }),
            createActualCase('202403', { value: 35 }),
            createActualCase('202404', { value: null }),
            createActualCase('202405', { value: 37 }),
        ]);

        expect(joined.periods).toEqual([
            '202402',
            '202403',
            '202404',
            '202405',
        ]);
        expect(joined.averages).toEqual([null, [30], [31], null]);
        expect(joined.ranges).toEqual([null, [10, 50], [11, 51], null]);
        expect(joined.midranges).toEqual([
            null,
            [20, 40],
            [21, 41],
            null,
        ]);
        expect(joined.realValues).toEqual([34, 35, null, 37]);
    });

    it('sorts weekly real periods chronologically before joining', () => {
        const joined = joinRealAndPredictedData(predicted, [
            createActualCase('2024W10', { value: 3 }),
            createActualCase('2024W2', { value: 2 }),
            createActualCase('2024W1', { value: 1 }),
        ]);

        expect(joined.periods).toEqual(['2024W1', '2024W2', '2024W10']);
        expect(joined.realValues).toEqual([1, 2, 3]);
    });

    it('returns an empty axis when there are no actual cases', () => {
        const joined = joinRealAndPredictedData(predicted, []);

        expect(joined.periods).toEqual([]);
        expect(joined.averages).toEqual([]);
        expect(joined.ranges).toEqual([]);
        expect(joined.midranges).toEqual([]);
        expect(joined.realValues).toEqual([]);
    });
});

describe('plotResultToViewData', () => {
    it('deduplicates and orders split periods chronologically', () => {
        const viewData = plotResultToViewData(
            {
                actualCases: [],
                evaluation: createBacktest(PERIOD_TYPES.WEEK),
                evaluationEntries: [
                    createEvaluationEntry({ splitPeriod: '2024W10' }),
                    createEvaluationEntry({ splitPeriod: '2024W2' }),
                    createEvaluationEntry({ splitPeriod: '2024W2' }),
                    createEvaluationEntry({ splitPeriod: '2024W1' }),
                ],
                splitPeriods: [],
            },
            'adm0',
        );

        expect(viewData.map(item => item.splitPoint)).toEqual([
            '2024W1',
            '2024W2',
            '2024W10',
        ]);
    });

    it('keeps first-seen order when the evaluation has no period type', () => {
        const viewData = plotResultToViewData(
            {
                actualCases: [],
                evaluation: createBacktest(null),
                evaluationEntries: [
                    createEvaluationEntry({ splitPeriod: '2024W10' }),
                    createEvaluationEntry({ splitPeriod: '2024W2' }),
                ],
                splitPeriods: [],
            },
            'adm0',
        );

        expect(viewData.map(item => item.splitPoint)).toEqual([
            '2024W10',
            '2024W2',
        ]);
    });

    it('filters entries and actual cases to the requested org unit', () => {
        const viewData = plotResultToViewData(
            {
                actualCases: [
                    createActualCase('2024W2', { ou: 'adm0', value: 33 }),
                    createActualCase('2024W2', { ou: 'ou-other', value: 99 }),
                ],
                evaluation: createBacktest(PERIOD_TYPES.WEEK),
                evaluationEntries: [
                    ...createQuantileEntries('2024W2', { orgUnit: 'adm0' }),
                    createEvaluationEntry({
                        orgUnit: 'ou-other',
                        period: '2024W2',
                        quantile: 0.5,
                        splitPeriod: '2024W1',
                        value: 99,
                    }),
                ],
                splitPeriods: [],
            },
            'adm0',
        );

        const modelData = viewData[0].evaluation[0].models[0].data;
        expect(viewData[0].evaluation[0].orgUnitId).toBe('adm0');
        expect(modelData.realValues).toEqual([33]);
        expect(modelData.averages).toEqual([[30]]);
    });

    it('maps a mixed five-quantile set into bands and joins present actuals', () => {
        const viewData = plotResultToViewData(
            {
                actualCases: [
                    createActualCase('2024W2', { value: 35 }),
                    createActualCase('2024W3', { value: 37 }),
                ],
                evaluation: createBacktest(PERIOD_TYPES.WEEK),
                evaluationEntries: createQuantileEntries('2024W2'),
                splitPeriods: [],
            },
            'adm0',
        );

        expect(viewData).toHaveLength(1);
        expect(viewData[0].splitPoint).toBe('2024W1');
        expect(viewData[0].evaluation[0].models[0].modelName).toBe(
            'evaluation',
        );

        const data = viewData[0].evaluation[0].models[0].data;
        expect(data.periods).toEqual(['2024W2', '2024W3']);
        expect(data.ranges).toEqual([[10, 50], null]);
        expect(data.midranges).toEqual([[20, 40], null]);
        expect(data.averages).toEqual([[30], null]);
        expect(data.realValues).toEqual([35, 37]);
    });

    it('produces an empty series when no actual cases exist for the org unit', () => {
        const viewData = plotResultToViewData(
            {
                actualCases: [
                    createActualCase('2024W2', { ou: 'ou-other', value: 99 }),
                ],
                evaluation: createBacktest(PERIOD_TYPES.WEEK),
                evaluationEntries: createQuantileEntries('2024W2'),
                splitPeriods: [],
            },
            'adm0',
        );

        const data = viewData[0].evaluation[0].models[0].data;
        expect(data.periods).toEqual([]);
        expect(data.realValues).toEqual([]);
    });
});

describe('buildPredictionSeries quantile mapping', () => {
    it('maps every supported quantile onto its named band', () => {
        const [series] = buildPredictionSeries(
            [
                createPredictionEntry({ quantile: 0.1, value: 10 }),
                createPredictionEntry({ quantile: 0.25, value: 20 }),
                createPredictionEntry({ quantile: 0.5, value: 30 }),
                createPredictionEntry({ quantile: 0.75, value: 40 }),
                createPredictionEntry({ quantile: 0.9, value: 50 }),
            ],
            new Map([['adm0', { displayName: 'Admin 0' }]]),
            'cases',
        );

        expect(series.points).toHaveLength(1);
        expect(series.points[0].quantiles).toEqual({
            quantile_low: 10,
            quantile_mid_low: 20,
            median: 30,
            quantile_mid_high: 40,
            quantile_high: 50,
        });
    });

    it('drops entries whose quantile has no band', () => {
        const series = buildPredictionSeries(
            [
                createPredictionEntry({ quantile: 0.05, value: 99 }),
                createPredictionEntry({ quantile: 0.5, value: 30 }),
            ],
            new Map([['adm0', { displayName: 'Admin 0' }]]),
            'cases',
        );

        expect(series).toHaveLength(1);
        expect(series[0].points).toHaveLength(1);
        expect(series[0].points[0].quantiles).toEqual({ median: 30 });
    });

    it('scopes actual cases to their org unit', () => {
        const series = buildPredictionSeries(
            [
                createPredictionEntry({ orgUnit: 'adm0' }),
                createPredictionEntry({ orgUnit: 'ou-other' }),
            ],
            new Map(),
            'cases',
            [
                createActualCase('2024W1', { ou: 'adm0', value: 11 }),
                createActualCase('2024W1', { ou: 'ou-other', value: null }),
            ],
        );

        const byOrgUnit = new Map(
            series.map(item => [item.orgUnitId, item]),
        );

        expect(byOrgUnit.get('adm0')?.actualCases).toEqual([
            { period: '2024W1', value: 11 },
        ]);
        expect(byOrgUnit.get('ou-other')?.actualCases).toEqual([
            { period: '2024W1', value: null },
        ]);
    });
});
