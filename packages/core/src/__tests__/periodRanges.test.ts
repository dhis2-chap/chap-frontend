import { getAdjacentFixedPeriods } from '@dhis2/multi-calendar-dates';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    compareFixedPeriods,
    generateFixedPeriods,
    getPeriodsInRange,
    type Dhis2Calendar,
    type Dhis2FixedPeriod,
    type Dhis2FixedPeriodType,
} from '../periodEngine';

vi.mock('@dhis2/multi-calendar-dates', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@dhis2/multi-calendar-dates')>();
    return { ...actual, getAdjacentFixedPeriods: vi.fn(actual.getAdjacentFixedPeriods) };
});

const adjacentPeriods = vi.mocked(getAdjacentFixedPeriods);

const locale = 'en';

/** The range one period at a time, which is what a range means. */
const stepThroughRange = (start: Dhis2FixedPeriod, end: Dhis2FixedPeriod, calendar: Dhis2Calendar): string[] => {
    const ids = [start.id];
    let current = start;
    while (current.id !== end.id) {
        [current] = getAdjacentFixedPeriods({ period: current, steps: 1, calendar, locale });
        ids.push(current.id);
    }
    return ids;
};

const periodsOfYear = (periodType: Dhis2FixedPeriodType, year: number, calendar: Dhis2Calendar) => (
    generateFixedPeriods({ periodType, year, calendar, locale }).sort(compareFixedPeriods)
);

const CALENDAR_YEARS: [Dhis2Calendar, number][] = [['gregory', 2021], ['nepali', 2078]];

const PERIOD_TYPES: Dhis2FixedPeriodType[] = [
    'DAILY', 'WEEKLY', 'WEEKLYWED', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'QUARTERLYNOV', 'SIXMONTHLYAPR', 'YEARLY', 'FYAPR', 'FYOCT',
];

describe('getPeriodsInRange', () => {
    beforeEach(() => {
        adjacentPeriods.mockClear();
    });

    it.each(CALENDAR_YEARS)('gives the same periods as stepping one at a time in the %s calendar', (calendar, year) => {
        PERIOD_TYPES.forEach((periodType) => {
            const [first, next, last] = [year, year + 1, year + 2].map(item => periodsOfYear(periodType, item, calendar));
            const ranges = [
                // From the last period of a year, over two year boundaries.
                [first.at(-1)!, last.at(-1)!],
                // From the middle of a year into the next one.
                [first[Math.floor(first.length / 2)], next[Math.floor(next.length / 2)]],
            ].filter(([start, end]) => compareFixedPeriods(start, end) < 0);

            ranges.forEach(([start, end]) => {
                const expected = stepThroughRange(start, end, calendar);

                const periods = getPeriodsInRange({ startPeriodId: start.id, endPeriodId: end.id, calendar, locale });

                expect(periods.map(period => period.id), `${periodType} ${start.id}-${end.id}`).toEqual(expected);
            });
        });
    });

    it('includes the start and the end period of a single-period range', () => {
        expect(getPeriodsInRange({ startPeriodId: '202403', endPeriodId: '202403', calendar: 'gregory', locale }).map(period => period.id))
            .toEqual(['202403']);
    });

    // The library generates a whole year of periods to find the ones that follow, so one call
    // for each period made a five-year range take long enough to hold up the page that counts it.
    it.each([
        ['months', '202001', '202409', 57],
        ['weeks', '2020W1', '2024W52', 261],
    ])('does not ask the calendar library for each of five years of %s', (_, startPeriodId, endPeriodId, count) => {
        const periods = getPeriodsInRange({ startPeriodId, endPeriodId, calendar: 'gregory', locale });

        expect(periods).toHaveLength(count);
        expect(adjacentPeriods.mock.calls.length).toBeLessThan(10);
    });
});
