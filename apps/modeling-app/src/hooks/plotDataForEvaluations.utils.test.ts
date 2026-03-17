import type { BackTestRead, EvaluationEntryExtend } from '@dhis2-chap/ui';
import { describe, expect, it, vi } from 'vitest';
import {
    getStableMaxYByOrgUnitId,
    PlotDataResult,
    plotResultsToViewData,
} from './plotDataForEvaluations.utils';

vi.mock('@dhis2-chap/ui', async () => {
    const evaluationResponse = await import(
        '../../../../packages/ui/src/utils/EvaluationResponse',
    );
    const timePeriodUtils = await import(
        '../../../../packages/ui/src/utils/timePeriodUtils',
    );

    return {
        createHighChartsData: evaluationResponse.createHighChartsData,
        joinRealAndPredictedData: evaluationResponse.joinRealAndPredictedData,
        normalizeEvaluationModelsToSharedPeriods:
            evaluationResponse.normalizeEvaluationModelsToSharedPeriods,
        PERIOD_TYPES: timePeriodUtils.PERIOD_TYPES,
        sortPeriods: timePeriodUtils.sortPeriods,
    };
});

const quantiles = [0.1, 0.25, 0.5, 0.75, 0.9];

const createEvaluation = (id: number, name: string): BackTestRead =>
    ({
        id,
        name,
        datasetId: id,
        modelId: `model-${id}`,
        dataset: {
            id,
            name: `dataset-${id}`,
            periodType: 'MONTH',
        },
        aggregateMetrics: {},
        configuredModel: null,
    }) as BackTestRead;

const createEntries = ({
    periods,
    splitPeriod,
    orgUnit,
    offset,
}: {
    periods: string[];
    splitPeriod: string;
    orgUnit: string;
    offset: number;
}): EvaluationEntryExtend[] =>
    periods.flatMap((period, periodIndex) =>
        quantiles.map((quantile, quantileIndex) => ({
            orgUnit,
            period,
            quantile,
            splitPeriod,
            value: offset + periodIndex * 10 + quantileIndex,
            modelName: undefined,
        })),
    );

const createPlotDataResult = ({
    evaluation,
    periods,
    splitPeriod,
    orgUnit,
    offset,
}: {
    evaluation: BackTestRead;
    periods: string[];
    splitPeriod: string;
    orgUnit: string;
    offset: number;
}): PlotDataResult => ({
    evaluation,
    splitPeriods: [splitPeriod],
    evaluationEntries: createEntries({
        periods,
        splitPeriod,
        orgUnit,
        offset,
    }),
    actualCases: periods.map((period, index) => ({
        pe: period,
        ou: orgUnit,
        value: offset + index,
    })),
});

const createViewData = ({
    orgUnitId = 'ou-1',
    splitPoint,
    models,
}: {
    orgUnitId?: string;
    splitPoint: string;
    models: Array<{
        modelName: string;
        periods: string[];
        averages: Array<[number] | null>;
        ranges: Array<[number, number] | null>;
        midranges?: Array<[number, number] | null>;
        realValues?: Array<number | null>;
    }>;
}) => ({
    splitPoint,
    evaluation: [
        {
            orgUnitId,
            orgUnitName: orgUnitId,
            models: models.map(model => ({
                modelName: model.modelName,
                data: {
                    periods: model.periods,
                    averages: model.averages,
                    ranges: model.ranges,
                    midranges: model.midranges,
                    realValues: model.realValues,
                },
            })),
        },
    ],
});

describe('plotResultsToViewData', () => {
    it('normalizes compare rows onto a shared period axis', () => {
        const splitPeriod = '202409';
        const orgUnit = 'ou-1';
        const result = plotResultsToViewData([
            createPlotDataResult({
                evaluation: createEvaluation(1, 'long evaluation'),
                periods: ['202410', '202411', '202412'],
                splitPeriod,
                orgUnit,
                offset: 100,
            }),
            createPlotDataResult({
                evaluation: createEvaluation(2, 'short evaluation'),
                periods: ['202410', '202411'],
                splitPeriod,
                orgUnit,
                offset: 200,
            }),
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].evaluation).toHaveLength(1);

        const [longModel, shortModel] = result[0].evaluation[0].models;

        expect(longModel.data.periods).toEqual(['202410', '202411', '202412']);
        expect(shortModel.data.periods).toEqual([
            '202410',
            '202411',
            '202412',
        ]);
        expect(shortModel.data.averages[2]).toBeNull();
        expect(shortModel.data.ranges[2]).toBeNull();
        expect(shortModel.data.midranges?.[2]).toBeNull();
        expect(shortModel.data.realValues?.[2]).toBeNull();
    });
});

describe('getStableMaxYByOrgUnitId', () => {
    it('uses one shared max per org unit across both models', () => {
        const maxYByOrgUnitId = getStableMaxYByOrgUnitId([
            createViewData({
                splitPoint: '202409',
                models: [
                    {
                        modelName: 'evaluation-a',
                        periods: ['202409'],
                        averages: [[80]],
                        ranges: [[60, 100]],
                        midranges: [[70, 90]],
                        realValues: [95],
                    },
                    {
                        modelName: 'evaluation-b',
                        periods: ['202409'],
                        averages: [[85]],
                        ranges: [[65, 120]],
                        midranges: [[75, 100]],
                        realValues: [110],
                    },
                ],
            }),
        ]);

        expect(maxYByOrgUnitId).toEqual({
            'ou-1': 126,
        });
    });

    it('keeps the max stable across split periods for the same org unit', () => {
        const maxYByOrgUnitId = getStableMaxYByOrgUnitId([
            createViewData({
                splitPoint: '202409',
                models: [
                    {
                        modelName: 'evaluation-a',
                        periods: ['202409'],
                        averages: [[50]],
                        ranges: [[30, 90]],
                        midranges: [[40, 70]],
                        realValues: [65],
                    },
                    {
                        modelName: 'evaluation-b',
                        periods: ['202409'],
                        averages: [[55]],
                        ranges: [[35, 95]],
                        midranges: [[45, 75]],
                        realValues: [70],
                    },
                ],
            }),
            createViewData({
                splitPoint: '202410',
                models: [
                    {
                        modelName: 'evaluation-a',
                        periods: ['202410'],
                        averages: [[40]],
                        ranges: [[25, 80]],
                        midranges: [[35, 60]],
                        realValues: [200],
                    },
                    {
                        modelName: 'evaluation-b',
                        periods: ['202410'],
                        averages: [[45]],
                        ranges: [[30, 85]],
                        midranges: [[40, 65]],
                        realValues: [75],
                    },
                ],
            }),
        ]);

        expect(maxYByOrgUnitId).toEqual({
            'ou-1': 210,
        });
    });

    it('prefers the highest actual or prediction interval and ignores chart order', () => {
        const firstOrdering = getStableMaxYByOrgUnitId([
            createViewData({
                splitPoint: '202409',
                models: [
                    {
                        modelName: 'prediction-dominant',
                        periods: ['202409'],
                        averages: [[90]],
                        ranges: [[40, 300]],
                        midranges: [[60, 140]],
                        realValues: [80],
                    },
                    {
                        modelName: 'actual-dominant',
                        periods: ['202409'],
                        averages: [[85]],
                        ranges: [[50, 150]],
                        midranges: [[70, 120]],
                        realValues: [250],
                    },
                ],
            }),
        ]);

        const secondOrdering = getStableMaxYByOrgUnitId([
            createViewData({
                splitPoint: '202409',
                models: [
                    {
                        modelName: 'actual-dominant',
                        periods: ['202409'],
                        averages: [[85]],
                        ranges: [[50, 150]],
                        midranges: [[70, 120]],
                        realValues: [250],
                    },
                    {
                        modelName: 'prediction-dominant',
                        periods: ['202409'],
                        averages: [[90]],
                        ranges: [[40, 300]],
                        midranges: [[60, 140]],
                        realValues: [80],
                    },
                ],
            }),
        ]);

        expect(firstOrdering).toEqual({
            'ou-1': 315,
        });
        expect(secondOrdering).toEqual(firstOrdering);
    });

    it('omits org units with no numeric chart values', () => {
        const maxYByOrgUnitId = getStableMaxYByOrgUnitId([
            createViewData({
                orgUnitId: 'ou-empty',
                splitPoint: '202409',
                models: [
                    {
                        modelName: 'evaluation-a',
                        periods: ['202409'],
                        averages: [null],
                        ranges: [null],
                        midranges: [null],
                        realValues: [null],
                    },
                    {
                        modelName: 'evaluation-b',
                        periods: ['202409'],
                        averages: [null],
                        ranges: [null],
                        midranges: [null],
                        realValues: [null],
                    },
                ],
            }),
        ]);

        expect(maxYByOrgUnitId).toEqual({});
    });

    it('stabilizes the max for a single evaluation across split periods', () => {
        const maxYByOrgUnitId = getStableMaxYByOrgUnitId([
            createViewData({
                orgUnitId: 'adm0',
                splitPoint: '202409',
                models: [
                    {
                        modelName: 'evaluation',
                        periods: ['202409'],
                        averages: [[70]],
                        ranges: [[40, 120]],
                        midranges: [[50, 90]],
                        realValues: [80],
                    },
                ],
            }),
            createViewData({
                orgUnitId: 'adm0',
                splitPoint: '202410',
                models: [
                    {
                        modelName: 'evaluation',
                        periods: ['202410'],
                        averages: [[50]],
                        ranges: [[30, 110]],
                        midranges: [[45, 75]],
                        realValues: [200],
                    },
                ],
            }),
        ]);

        expect(maxYByOrgUnitId).toEqual({
            adm0: 210,
        });
    });
});
