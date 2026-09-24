import { describe, expect, it } from 'vitest';
import { getBacktestSplitting, getRequiredPeriodCount } from './backtestDefaults';

describe('getRequiredPeriodCount', () => {
    it('covers every split plus one training period', () => {
        expect(getRequiredPeriodCount(getBacktestSplitting('month')!)).toBe(13);
        expect(getRequiredPeriodCount(getBacktestSplitting('week')!)).toBe(49);
    });
});
