import { describe, expect, it } from 'vitest';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import type { DataElement, PredictionEntry } from '../../httpfunctions';
import { buildPredictionSeries } from '../PredictionViewModel';

const createPredictionEntry = (period: string): PredictionEntry => ({
    orgUnit: 'adm0',
    period,
    quantile: 0.5,
    value: 1,
});

const createActualCase = (period: string): DataElement => ({
    ou: 'adm0',
    pe: period,
    value: 1,
});

describe('buildPredictionSeries', () => {
    it('orders weekly prediction points and actual cases chronologically', () => {
        const [series] = buildPredictionSeries(
            [
                createPredictionEntry('2024W10'),
                createPredictionEntry('2024W2'),
                createPredictionEntry('2024W1'),
            ],
            new Map([['adm0', { displayName: 'Admin 0' }]]),
            'cases',
            [
                createActualCase('2024W10'),
                createActualCase('2024W2'),
                createActualCase('2024W1'),
            ],
            PERIOD_TYPES.WEEK,
        );

        expect(series.points.map(point => point.period)).toEqual([
            '2024W1',
            '2024W2',
            '2024W10',
        ]);
        expect(series.actualCases?.map(point => point.period)).toEqual([
            '2024W1',
            '2024W2',
            '2024W10',
        ]);
    });
});
