import { describe, expect, it } from 'vitest';
import { DEFAULT_BACKTEST_PARAMETERS, getMinimumEvaluationPeriods } from './backtestDefaults';

describe('getMinimumEvaluationPeriods', () => {
    it('covers every split plus one training period', () => {
        expect(getMinimumEvaluationPeriods('month')).toBe(10);
        expect(getMinimumEvaluationPeriods('WEEK')).toBe(10);
        expect(getMinimumEvaluationPeriods('day')).toBeUndefined();
    });

    it('uses the selected forecast horizon, split count and stride', () => {
        expect(getMinimumEvaluationPeriods('month', {
            ...DEFAULT_BACKTEST_PARAMETERS, nPeriods: 6, nSplits: 4, stride: 2,
        })).toBe(13);
        expect(getMinimumEvaluationPeriods('week', {
            ...DEFAULT_BACKTEST_PARAMETERS, nPeriods: 12, nSplits: 1, stride: 4,
        })).toBe(13);
    });

    it('does not report a dataset length requirement while counts are invalid', () => {
        for (const stride of [NaN, 0, -1, 1.5]) {
            expect(getMinimumEvaluationPeriods('month', { ...DEFAULT_BACKTEST_PARAMETERS, stride })).toBeUndefined();
        }
    });
});
