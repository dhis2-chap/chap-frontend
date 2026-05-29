import { describe, expect, it } from 'vitest';
import type { PredictionInfo } from '@dhis2-chap/ui';
import {
    buildPredictionRunMetaData,
    formatPeriodId,
    getNextPeriods,
    getPredictionPeriodIds,
    getTrainingDataToDate,
} from './predictionRunMetadata';

const createPrediction = (overrides: Partial<PredictionInfo>): PredictionInfo => ({
    datasetId: 1,
    modelId: 'model',
    nPeriods: 3,
    name: 'Prediction',
    created: '2026-05-01T09:50:00Z',
    id: 1,
    configuredModel: null,
    dataset: {
        id: 1,
        name: 'Dataset',
        lastPeriod: '202604',
        periodType: 'MONTH',
    },
    ...overrides,
});

describe('predictionRunMetadata', () => {
    it('derives monthly prediction periods from the training cutoff', () => {
        expect(getNextPeriods('202604', 'MONTH', 3)).toEqual([
            '202605',
            '202606',
            '202607',
        ]);
    });

    it('derives weekly prediction periods across year boundaries', () => {
        expect(getNextPeriods('2025W52', 'WEEK', 3)).toEqual([
            '2026W01',
            '2026W02',
            '2026W03',
        ]);
    });

    it('uses explicit metadata periods before deriving them', () => {
        const prediction = createPrediction({
            metaData: {
                predictionPeriods: ['202701', '202702'],
            },
        });

        expect(getPredictionPeriodIds(prediction)).toEqual(['202701', '202702']);
    });

    it('falls back to dataset metadata for existing prediction runs', () => {
        const prediction = createPrediction({});

        expect(getTrainingDataToDate(prediction)).toBe('202604');
        expect(getPredictionPeriodIds(prediction)).toEqual([
            '202605',
            '202606',
            '202607',
        ]);
    });

    it('builds metadata for newly-created prediction runs', () => {
        expect(buildPredictionRunMetaData({
            nPeriods: 2,
            periodType: 'MONTH',
            trainingPeriods: ['202603', '202604'],
        })).toEqual({
            trainingData: {
                fromDate: '202603',
                toDate: '202604',
                periods: ['202603', '202604'],
            },
            trainingDataToDate: '202604',
            predictionPeriods: ['202605', '202606'],
        });
    });

    it('formats monthly period ids for display', () => {
        expect(formatPeriodId('202410')).toBe('October 2024');
    });

    it('formats weekly period ids for display', () => {
        expect(formatPeriodId('2025W9')).toBe('Week 9, 2025');
        expect(formatPeriodId('2025W09')).toBe('Week 9, 2025');
    });

    it('keeps unrecognized period ids unchanged', () => {
        expect(formatPeriodId('not-a-period')).toBe('not-a-period');
    });
});
