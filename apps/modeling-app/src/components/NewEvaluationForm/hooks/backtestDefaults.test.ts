import { describe, expect, it } from 'vitest';
import { getMinimumEvaluationPeriods } from './backtestDefaults';

describe('getMinimumEvaluationPeriods', () => {
    it('covers every split plus one training period', () => {
        expect(getMinimumEvaluationPeriods('month')).toBe(13);
        expect(getMinimumEvaluationPeriods('WEEK')).toBe(49);
        expect(getMinimumEvaluationPeriods('day')).toBeUndefined();
    });
});
