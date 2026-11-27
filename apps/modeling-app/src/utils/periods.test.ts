import { getPeriodsInRange } from '@dhis2-chap/core';
import { describe, expect, it, vi } from 'vitest';
import { countPeriods } from './periods';

vi.mock('@dhis2-chap/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@dhis2-chap/core')>();
    return { ...actual, getPeriodsInRange: vi.fn(actual.getPeriodsInRange) };
});

const periodsInRange = vi.mocked(getPeriodsInRange);

describe('countPeriods', () => {
    it('counts the periods from start to end inclusive', () => {
        expect(countPeriods('202001', '202409')).toBe(57);
        expect(countPeriods('2020W52', '2021W2')).toBe(4);
        expect(countPeriods('202403', '202403')).toBe(1);
    });

    it('counts in the calendar it is given', () => {
        // A Nepali year has twelve months, and 2078 starts in April 2021 of the Gregorian calendar.
        expect(countPeriods('207801', '207812', 'nepali')).toBe(12);
    });

    it('is undefined when the range cannot be resolved', () => {
        expect(countPeriods(undefined, '202409')).toBeUndefined();
        expect(countPeriods('202001', null)).toBeUndefined();
        expect(countPeriods('not a period', '202409')).toBeUndefined();
        expect(countPeriods('202001', '2020W5')).toBeUndefined();
    });

    // Forms and pages count the periods of their data on every render, and walking the range is slow.
    it('walks a range once however often it is counted', () => {
        periodsInRange.mockClear();

        expect(countPeriods('201901', '202312')).toBe(60);
        expect(countPeriods('201901', '202312')).toBe(60);
        expect(countPeriods('201901', '202312', 'gregory')).toBe(60);

        expect(periodsInRange).toHaveBeenCalledTimes(1);
    });

    it('counts a range again in another calendar', () => {
        periodsInRange.mockClear();

        countPeriods('207701', '207712', 'nepali');
        countPeriods('207701', '207712', 'gregory');

        expect(periodsInRange).toHaveBeenCalledTimes(2);
    });
});
