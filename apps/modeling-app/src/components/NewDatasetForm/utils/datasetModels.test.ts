import { describe, expect, it } from 'vitest';
import type { ModelSpecRead } from '@dhis2-chap/ui';
import { datasetSupportsModel } from './datasetModels';

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
