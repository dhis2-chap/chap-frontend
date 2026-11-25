import { describe, expect, it } from 'vitest';
import type { BacktestRead, BacktestSpecificationSummary, DataSetInfo } from '@dhis2-chap/ui';
import { getCoverageStatus, getGuidedSetupSummary } from './guidedStatus';

const dataset = { id: 1, name: 'Dengue' } as DataSetInfo & { id: number };
const specification = (id: number, datasetId = 1) => ({ id, dataset: { id: datasetId } }) as BacktestSpecificationSummary;
const run = (id: number, specificationId: number, predictionSetupId: number | null = null, datasetId = 1) => (
    { id, specificationId, predictionSetupId, datasetId } as BacktestRead
);

describe('getGuidedSetupSummary', () => {
    it('is not evaluated without an evaluation or a running job', () => {
        expect(getGuidedSetupSummary(dataset, [], [], 0)).toMatchObject({ stage: 'notEvaluated', step: 'evaluate' });
    });

    it('is evaluating while the first models run', () => {
        expect(getGuidedSetupSummary(dataset, [], [], 2)).toMatchObject({ stage: 'evaluating', step: 'evaluate' });
    });

    it('is ready to promote when the newest evaluation has results but nothing is promoted', () => {
        const summary = getGuidedSetupSummary(dataset, [specification(3), specification(5)], [run(10, 5), run(11, 3), run(12, 6, 7, 2)], 0);
        expect(summary).toMatchObject({ stage: 'readyToPromote', step: 'promote' });
        expect(summary.runs.map(item => item.id)).toEqual([10]);
    });

    it('stays promoted when the data is evaluated again with other settings', () => {
        const summary = getGuidedSetupSummary(dataset, [specification(3), specification(5)], [run(10, 5), run(11, 3, 7)], 0);
        expect(summary).toMatchObject({ stage: 'promoted', step: 'predict' });
        expect(summary.runs.map(item => item.id)).toEqual([10]);
        expect(summary.promotedRuns.map(item => item.id)).toEqual([11]);
    });

    it('is promoted once a model of the newest evaluation is promoted', () => {
        const summary = getGuidedSetupSummary(dataset, [specification(5), specification(6, 2)], [run(10, 5), run(12, 5, 4)], 0);
        expect(summary).toMatchObject({ stage: 'promoted', step: 'predict' });
        expect(summary.promotedRuns.map(item => item.id)).toEqual([12]);
    });
});

describe('getCoverageStatus', () => {
    it('passes close to the expected share, warns a little below it and fails far below it', () => {
        expect(getCoverageStatus(0.8, 0.8)).toBe('good');
        expect(getCoverageStatus(0.75, 0.8)).toBe('good');
        expect(getCoverageStatus(0.7, 0.8)).toBe('caution');
        expect(getCoverageStatus(0.6, 0.8)).toBe('caution');
        expect(getCoverageStatus(0.55, 0.8)).toBe('bad');
    });
});
