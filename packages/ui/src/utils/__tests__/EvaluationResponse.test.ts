import { describe, expect, it } from 'vitest';
import { ModelData } from '../../interfaces/Evaluation';
import { normalizeEvaluationModelsToSharedPeriods } from '../EvaluationResponse';
import { PERIOD_TYPES } from '../timePeriodUtils';

const createModel = (
    modelName: string,
    data: ModelData['data'],
): ModelData => ({
    modelName,
    data,
});

describe('normalizeEvaluationModelsToSharedPeriods', () => {
    it('shares one monthly period axis across models with different end periods', () => {
        const models = normalizeEvaluationModelsToSharedPeriods(
            [
                createModel('long', {
                    periods: ['202410', '202411', '202412'],
                    averages: [[10], [11], [12]],
                    ranges: [[8, 12], [9, 13], [10, 14]],
                    midranges: [[9, 11], [10, 12], [11, 13]],
                    realValues: [20, 21, 22],
                }),
                createModel('short', {
                    periods: ['202410', '202411'],
                    averages: [[30], [31]],
                    ranges: [[28, 32], [29, 33]],
                    midranges: [[29, 31], [30, 32]],
                    realValues: [40, 41],
                }),
            ],
            PERIOD_TYPES.MONTH,
        );

        expect(models.map(model => model.data.periods)).toEqual([
            ['202410', '202411', '202412'],
            ['202410', '202411', '202412'],
        ]);
        expect(models[1].data.averages).toEqual([[30], [31], null]);
        expect(models[1].data.ranges).toEqual([
            [28, 32],
            [29, 33],
            null,
        ]);
        expect(models[1].data.midranges).toEqual([
            [29, 31],
            [30, 32],
            null,
        ]);
        expect(models[1].data.realValues).toEqual([40, 41, null]);
    });

    it('pads gaps in the middle of the shared axis with nulls', () => {
        const models = normalizeEvaluationModelsToSharedPeriods(
            [
                createModel('with-gap', {
                    periods: ['202401', '202403'],
                    averages: [[10], [30]],
                    ranges: [[8, 12], [28, 32]],
                    midranges: [[9, 11], [29, 31]],
                    realValues: [20, 40],
                }),
                createModel('full', {
                    periods: ['202401', '202402', '202403'],
                    averages: [[1], [2], [3]],
                    ranges: [[0, 2], [1, 3], [2, 4]],
                    midranges: [[0.5, 1.5], [1.5, 2.5], [2.5, 3.5]],
                    realValues: [5, 6, 7],
                }),
            ],
            PERIOD_TYPES.MONTH,
        );

        expect(models[0].data.periods).toEqual(['202401', '202402', '202403']);
        expect(models[0].data.averages).toEqual([[10], null, [30]]);
        expect(models[0].data.ranges).toEqual([[8, 12], null, [28, 32]]);
        expect(models[0].data.midranges).toEqual([
            [9, 11],
            null,
            [29, 31],
        ]);
        expect(models[0].data.realValues).toEqual([20, null, 40]);
    });

    it('fills absent optional series with nulls across the shared axis', () => {
        const models = normalizeEvaluationModelsToSharedPeriods(
            [
                createModel('missing-optional-series', {
                    periods: ['202401'],
                    averages: [[10]],
                    ranges: [[8, 12]],
                }),
                createModel('full', {
                    periods: ['202401', '202402'],
                    averages: [[1], [2]],
                    ranges: [[0, 2], [1, 3]],
                    midranges: [[0.5, 1.5], [1.5, 2.5]],
                    realValues: [5, 6],
                }),
            ],
            PERIOD_TYPES.MONTH,
        );

        expect(models[0].data.periods).toEqual(['202401', '202402']);
        expect(models[0].data.midranges).toEqual([null, null]);
        expect(models[0].data.realValues).toEqual([null, null]);
    });
});
