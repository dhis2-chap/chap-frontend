import { describe, expect, it } from 'vitest';
import type { ModelSpecRead } from '@dhis2-chap/ui';
import { datasetSupportsModel, getModelSupport } from './datasetModels';

const model: ModelSpecRead = {
    id: 1,
    name: 'configured',
    target: { name: 'disease_cases', displayName: 'Cases', description: '' },
    covariates: [{ name: 'rainfall', displayName: 'Rainfall', description: '' }],
    additionalContinuousCovariates: ['humidity', 'gen:year'],
    supportedPeriodType: 'month' as ModelSpecRead['supportedPeriodType'],
};

describe('datasetSupportsModel', () => {
    it('requires every covariate, the target and extra continuous covariates', () => {
        expect(datasetSupportsModel(['disease_cases', 'rainfall'], 'MONTH', model)).toBe(false);
        expect(datasetSupportsModel(['disease_cases', 'humidity'], 'MONTH', model)).toBe(false);
        expect(datasetSupportsModel(['disease_cases', 'rainfall', 'humidity'], 'MONTH', model)).toBe(true);
    });

    it('matches names exactly and allows extra columns', () => {
        expect(datasetSupportsModel(['disease_cases', 'rainfall', 'humidity', 'unused'], 'MONTH', model)).toBe(true);
        expect(datasetSupportsModel(['disease_cases', 'Rainfall', 'humidity'], 'MONTH', model)).toBe(false);
    });

    it('checks the period type and excludes archived models', () => {
        const names = ['disease_cases', 'rainfall', 'humidity'];
        expect(datasetSupportsModel(names, 'WEEK', model)).toBe(false);
        expect(datasetSupportsModel(names, 'WEEK', { ...model, supportedPeriodType: 'any' as ModelSpecRead['supportedPeriodType'] })).toBe(true);
        expect(datasetSupportsModel(names, 'MONTH', { ...model, archived: true })).toBe(false);
        expect(datasetSupportsModel(names, '', model)).toBe(false);
    });
});

describe('getModelSupport', () => {
    const weekly = { ...model, id: 2, name: 'weekly', supportedPeriodType: 'week' as ModelSpecRead['supportedPeriodType'] };
    const casesOnly = { ...model, id: 3, name: 'cases-only', covariates: [], additionalContinuousCovariates: [] };
    const needsTwo = { ...model, id: 4, name: 'needs-two', additionalContinuousCovariates: ['humidity', 'population'] };

    it('splits models by why they can or cannot run', () => {
        const support = getModelSupport(['disease_cases', 'rainfall'], 'MONTH', [model, weekly, casesOnly, needsTwo]);

        expect(support.supported.map(m => m.name)).toEqual(['cases-only']);
        expect(support.wrongPeriodType.map(m => m.name)).toEqual(['weekly']);
        expect(support.missingColumns).toEqual([
            { model, missing: ['humidity'] },
            { model: needsTwo, missing: ['humidity', 'population'] },
        ]);
    });

    it('suggests the column sets that make the most models runnable', () => {
        const other = { ...model, id: 5, name: 'other' };
        const support = getModelSupport(['disease_cases'], 'MONTH', [model, other, needsTwo, casesOnly]);

        expect(support.nextColumns).toEqual([
            { columns: ['rainfall', 'humidity', 'population'], models: [model, other, needsTwo] },
            { columns: ['rainfall', 'humidity'], models: [model, other] },
        ]);
    });

    it('ignores archived models', () => {
        expect(getModelSupport(['disease_cases'], 'MONTH', [{ ...casesOnly, archived: true }]).supported).toEqual([]);
    });
});
