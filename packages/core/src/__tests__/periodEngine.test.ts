import { describe, expect, it } from 'vitest';
import {
    canonicalizePeriodId,
    comparePeriodIds,
    generateFixedPeriods,
    getLastCompletedPeriodId,
    getNextPeriodIds,
    getPeriodIdsInRange,
    normalizeDhis2CalendarSetting,
    sortPeriodIds,
    toDhis2FixedPeriodType,
} from '../periodEngine';

const gregoryOptions = {
    calendar: 'gregory',
    locale: 'en',
} as const;

describe('periodEngine', () => {
    it('normalizes DHIS2 calendar settings', () => {
        expect(normalizeDhis2CalendarSetting(undefined)).toBe('gregory');
        expect(normalizeDhis2CalendarSetting('gregorian')).toBe('gregory');
        expect(normalizeDhis2CalendarSetting('ethiopian')).toBe('ethiopic');
        expect(normalizeDhis2CalendarSetting('thai')).toBe('buddhist');
    });

    it('throws for unsupported DHIS2 calendar settings', () => {
        expect(() => normalizeDhis2CalendarSetting('julian')).toThrow(
            'Unsupported DHIS2 calendar "julian"',
        );
    });

    it('maps CHAP period aliases to DHIS2 fixed period types', () => {
        expect(toDhis2FixedPeriodType('MONTH')).toBe('MONTHLY');
        expect(toDhis2FixedPeriodType('WEEK')).toBe('WEEKLY');
        expect(toDhis2FixedPeriodType('MONTHLY')).toBe('MONTHLY');
        expect(toDhis2FixedPeriodType('WEEKLY')).toBe('WEEKLY');
    });

    it('canonicalizes padded weekly ids to DHIS2 library output', () => {
        expect(canonicalizePeriodId('2024W01')).toBe('2024W1');
        expect(canonicalizePeriodId('2024TueW09')).toBe('2024TueW9');
        expect(canonicalizePeriodId('2024BiW03')).toBe('2024BiW3');
        expect(canonicalizePeriodId('202405')).toBe('202405');
    });

    it('generates monthly periods with canonical DHIS2 ids', () => {
        const periods = generateFixedPeriods({
            ...gregoryOptions,
            periodType: 'MONTHLY',
            year: 2024,
        });

        expect(periods).toHaveLength(12);
        expect(periods[0]).toMatchObject({
            id: '202401',
            periodType: 'MONTHLY',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
        });
        expect(periods[11].id).toBe('202412');
    });

    it('expands inclusive weekly ranges and emits canonical unpadded ids', () => {
        expect(getPeriodIdsInRange({
            ...gregoryOptions,
            startPeriodId: '2024W01',
            endPeriodId: '2024W03',
        })).toEqual(['2024W1', '2024W2', '2024W3']);
    });

    it('sorts week ids chronologically instead of lexicographically', () => {
        expect(sortPeriodIds(['2024W10', '2024W2', '2024W1'], gregoryOptions)).toEqual([
            '2024W1',
            '2024W2',
            '2024W10',
        ]);
        expect(comparePeriodIds({
            ...gregoryOptions,
            a: '2024W9',
            b: '2024W10',
        })).toBeLessThan(0);
    });

    it('finds the last completed monthly period for a calendar date', () => {
        expect(getLastCompletedPeriodId({
            ...gregoryOptions,
            periodType: 'MONTHLY',
            date: '2026-05-29',
        })).toBe('202604');
    });

    it('finds next period ids after the given period', () => {
        expect(getNextPeriodIds({
            ...gregoryOptions,
            periodId: '2024W52',
            count: 3,
        })).toEqual(['2025W1', '2025W2', '2025W3']);
    });
});
