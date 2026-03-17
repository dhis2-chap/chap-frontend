import type { BackTestRead, EvaluationEntryExtend } from '@dhis2-chap/ui';
import { describe, expect, it, vi } from 'vitest';
import {
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
