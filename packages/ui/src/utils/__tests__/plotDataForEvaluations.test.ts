import { describe, expect, it } from 'vitest';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import type { BacktestRead, EvaluationEntry } from '../../httpfunctions';
import {
    getStableMaxYByOrgUnitId,
    plotResultsToViewData,
} from '../plotDataForEvaluations';

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

const createBacktest = (periodType: string): BacktestRead => ({
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
});

const createEvaluationEntry = (
    splitPeriod: string,
): EvaluationEntry => ({
    orgUnit: 'adm0',
    period: splitPeriod,
    quantile: 0.5,
    splitPeriod,
    value: 1,
});

describe('plotResultsToViewData', () => {
    it('orders weekly split periods chronologically', () => {
        const viewData = plotResultsToViewData([
            {
                actualCases: [],
                evaluation: createBacktest(PERIOD_TYPES.WEEK),
                evaluationEntries: [
                    createEvaluationEntry('2024W10'),
                    createEvaluationEntry('2024W2'),
                    createEvaluationEntry('2024W1'),
                ],
                splitPeriods: [],
            },
        ]);

        expect(viewData.map(item => item.splitPoint)).toEqual([
            '2024W1',
            '2024W2',
            '2024W10',
        ]);
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
