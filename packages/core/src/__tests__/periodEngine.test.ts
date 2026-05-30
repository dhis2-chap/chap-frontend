import { describe, expect, it } from 'vitest';
import {
    canonicalizePeriodId,
    comparePeriodIds,
    createFixedPeriodFromPeriodId,
    generateFixedPeriods,
    getLastCompletedPeriodId,
    getLastNPeriodIds,
    getNextPeriodIds,
    getPeriodsInRange,
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

    it('creates periods from padded and unpadded week ids with canonical ids', () => {
        expect(createFixedPeriodFromPeriodId({
            ...gregoryOptions,
            periodId: '2024W01',
        }).id).toBe('2024W1');
        expect(createFixedPeriodFromPeriodId({
            ...gregoryOptions,
            periodId: '2024W1',
        }).id).toBe('2024W1');
    });

    it('expands inclusive weekly ranges and emits canonical unpadded ids', () => {
        expect(getPeriodsInRange({
            ...gregoryOptions,
            startPeriodId: '2024W01',
            endPeriodId: '2024W03',
        }).map(period => period.id)).toEqual(['2024W1', '2024W2', '2024W3']);
    });

    it('expands weekly ranges over ISO week 53', () => {
        const periods = getPeriodsInRange({
            ...gregoryOptions,
            startPeriodId: '2020W53',
            endPeriodId: '2021W1',
        });

        expect(periods).toHaveLength(2);
        expect(periods[0]).toMatchObject({
            id: '2020W53',
            startDate: '2020-12-28',
            endDate: '2021-01-03',
        });
        expect(periods[1]).toMatchObject({
            id: '2021W1',
            startDate: '2021-01-04',
            endDate: '2021-01-10',
        });
    });

    it('returns empty arrays for reversed ranges', () => {
        expect(getPeriodsInRange({
            ...gregoryOptions,
            startPeriodId: '2024W3',
            endPeriodId: '2024W1',
        }).map(period => period.id)).toEqual([]);
        expect(getPeriodsInRange({
            ...gregoryOptions,
            startPeriodId: '202403',
            endPeriodId: '202401',
        }).map(period => period.id)).toEqual([]);
    });

    it('throws for invalid period ids', () => {
        expect(() => createFixedPeriodFromPeriodId({
            ...gregoryOptions,
            periodId: 'invalid',
        })).toThrow();
        expect(() => getPeriodsInRange({
            ...gregoryOptions,
            startPeriodId: 'invalid',
            endPeriodId: '202403',
        })).toThrow();
        expect(() => getLastNPeriodIds({
            ...gregoryOptions,
            periodId: 'invalid',
            count: 3,
        })).toThrow();
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
        expect(getLastCompletedPeriodId({
            ...gregoryOptions,
            periodType: 'MONTHLY',
            date: '2026-12-15',
        })).toBe('202611');
    });

    it('finds next period ids after the given period', () => {
        expect(getNextPeriodIds({
            ...gregoryOptions,
            periodId: '2024W52',
            count: 3,
        })).toEqual(['2025W1', '2025W2', '2025W3']);
    });

    it('returns the last N monthly period ids including the base period', () => {
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '202412',
            count: 3,
        })).toEqual(['202410', '202411', '202412']);
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '202412',
            count: 12,
        })).toEqual([
            '202401',
            '202402',
            '202403',
            '202404',
            '202405',
            '202406',
            '202407',
            '202408',
            '202409',
            '202410',
            '202411',
            '202412',
        ]);
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '202402',
            count: 4,
        })).toEqual(['202311', '202312', '202401', '202402']);
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '202412',
            count: 1,
        })).toEqual(['202412']);
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '202412',
            count: 0,
        })).toEqual([]);
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '202412',
            count: -1,
        })).toEqual([]);
    });

    it('returns the last N weekly period ids including the base period', () => {
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '2024W10',
            count: 3,
        })).toEqual(['2024W8', '2024W9', '2024W10']);
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '2024W02',
            count: 4,
        })).toEqual(['2023W51', '2023W52', '2024W1', '2024W2']);
        expect(getLastNPeriodIds({
            ...gregoryOptions,
            periodId: '2024W10',
            count: 1,
        })).toEqual(['2024W10']);
    });

    it('uses DHIS2 display formatting for created fixed periods', () => {
        expect(createFixedPeriodFromPeriodId({
            ...gregoryOptions,
            periodId: '202401',
        }).displayName).toBe('January 2024');
        expect(createFixedPeriodFromPeriodId({
            ...gregoryOptions,
            periodId: '2024W01',
        }).displayName).toBe('Week 1 - 2024-01-01 - 2024-01-07');
    });
});
