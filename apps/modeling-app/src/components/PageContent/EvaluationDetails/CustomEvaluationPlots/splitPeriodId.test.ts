import { describe, expect, it } from 'vitest';
import { toSplitPeriodId } from './splitPeriodId';

describe('toSplitPeriodId', () => {
    it('reads the period id of a monthly split period', () => {
        expect(toSplitPeriodId('2023-10-01', 'month')).toBe('202310');
    });

    it('gives up on period types it cannot identify', () => {
        expect(toSplitPeriodId('2023-10-02', 'week')).toBeUndefined();
        expect(toSplitPeriodId('2023-10-01', undefined)).toBeUndefined();
    });

    it('gives up on values that are not ISO dates', () => {
        expect(toSplitPeriodId('202310', 'month')).toBeUndefined();
    });
});
