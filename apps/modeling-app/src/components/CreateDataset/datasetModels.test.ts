import { describe, expect, it } from 'vitest';
import type { ModelSpecRead, ModelTemplateRead } from '@dhis2-chap/ui';
import { datasetSupportsModel } from './datasetModels';

const template: ModelTemplateRead = {
    id: 1, name: 'template', target: 'cases', requiredCovariates: ['rainfall', 'gen:month'],
    supportedPeriodType: 'month' as ModelTemplateRead['supportedPeriodType'],
};
const model: ModelSpecRead = {
    id: 2, name: 'configured', target: { name: 'cases', displayName: 'Cases', description: '' },
    covariates: [{ name: 'rainfall', displayName: 'Rainfall', description: '' }],
    additionalContinuousCovariates: ['humidity', 'gen:year'],
    supportedPeriodType: 'month' as ModelSpecRead['supportedPeriodType'],
};

describe('datasetSupportsModel', () => {
    it('matches exact names, includes the target and ignores generated inputs and extra columns', () => {
        expect(datasetSupportsModel(['cases', 'rainfall', 'unused'], 'MONTH', template)).toBe(true);
        expect(datasetSupportsModel(['disease_cases', 'rainfall'], 'MONTH', template)).toBe(false);
        expect(datasetSupportsModel(['cases', 'Rainfall'], 'MONTH', template)).toBe(false);
    });
    it('requires configured extras as well as template covariates', () => {
        expect(datasetSupportsModel(['cases', 'rainfall'], 'MONTH', model)).toBe(false);
        expect(datasetSupportsModel(['cases', 'humidity'], 'MONTH', model)).toBe(false);
        expect(datasetSupportsModel(['cases', 'rainfall', 'humidity'], 'MONTH', model)).toBe(true);
    });
    it('checks period type and excludes archived models', () => {
        expect(datasetSupportsModel(['cases', 'rainfall'], 'WEEK', template)).toBe(false);
        expect(datasetSupportsModel(['cases', 'rainfall'], 'WEEK', { ...template, supportedPeriodType: 'any' as ModelTemplateRead['supportedPeriodType'] })).toBe(true);
        expect(datasetSupportsModel(['cases', 'rainfall'], 'MONTH', { ...template, archived: true })).toBe(false);
        expect(datasetSupportsModel(['cases', 'rainfall'], '', template)).toBe(false);
    });
});
