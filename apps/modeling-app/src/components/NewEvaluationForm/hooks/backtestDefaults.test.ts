import { describe, expect, it } from 'vitest';
import { getMinimumEvaluationPeriods, toBacktestDefaults } from './backtestDefaults';

const DEFAULTS = { nPeriods: 3, nSplits: 7, stride: 1 };

describe('toBacktestDefaults', () => {
    it('maps parameter metadata to form values', () => {
        expect(toBacktestDefaults([
            { name: 'nPeriods', label: 'Forecast periods', description: '', default: 3, type: 'integer', minimum: 1 },
            { name: 'futureWeatherProvider', label: 'Provider', description: '', default: 'climatology', type: 'string' },
        ])).toEqual({ nPeriods: 3, futureWeatherProvider: 'climatology' });
    });
});

describe('getMinimumEvaluationPeriods', () => {
    it('covers every split plus one training period', () => {
        expect(getMinimumEvaluationPeriods('month', DEFAULTS)).toBe(10);
        expect(getMinimumEvaluationPeriods('WEEK', DEFAULTS)).toBe(10);
        expect(getMinimumEvaluationPeriods('day', DEFAULTS)).toBeUndefined();
        expect(getMinimumEvaluationPeriods('month', undefined)).toBeUndefined();
    });

    it('uses the selected forecast horizon, split count and stride', () => {
        expect(getMinimumEvaluationPeriods('month', { nPeriods: 6, nSplits: 4, stride: 2 })).toBe(13);
        expect(getMinimumEvaluationPeriods('week', { nPeriods: 12, nSplits: 1, stride: 4 })).toBe(13);
    });

    it('does not report a dataset length requirement while counts are invalid', () => {
        for (const stride of [NaN, 0, -1, 1.5]) {
            expect(getMinimumEvaluationPeriods('month', { ...DEFAULTS, stride })).toBeUndefined();
        }
    });
});
