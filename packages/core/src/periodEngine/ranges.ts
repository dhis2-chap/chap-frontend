import { getAdjacentFixedPeriods } from '@dhis2/multi-calendar-dates';
import { DEFAULT_DHIS2_LOCALE, MAX_PERIOD_RANGE } from './constants';
import {
    compareFixedPeriods,
    createFixedPeriodFromPeriodId,
    generateFixedPeriods,
} from './fixedPeriods';
import type {
    Dhis2FixedPeriod,
    PeriodEngineOptions,
    PeriodIdOptions,
    PeriodTypeOptions,
} from './types';

type PeriodRangeOptions = PeriodEngineOptions & {
    startPeriodId: string;
    endPeriodId: string;
};

type PeriodComparisonOptions = PeriodEngineOptions & {
    a: string;
    b: string;
};

type PeriodCountOptions = PeriodIdOptions & {
    count: number;
};

/** How many following periods a range asks the library for first; about a year of months. */
const FIRST_RANGE_BATCH = 12;

const getPeriodIdYear = (period: Dhis2FixedPeriod): number => {
    const year = parseInt(period.id.substring(0, 4), 10);

    if (Number.isNaN(year)) {
        throw new Error(`Could not determine the year for period "${period.id}"`);
    }

    return year;
};

const generateSortedPeriodsForYear = ({
    periodType,
    year,
    calendar,
    locale,
}: PeriodTypeOptions & { year: number }): Dhis2FixedPeriod[] => (
    generateFixedPeriods({
        periodType,
        year,
        calendar,
        locale,
    }).sort(compareFixedPeriods)
);

export const getPreviousFixedPeriod = ({
    period,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodEngineOptions & { period: Dhis2FixedPeriod }): Dhis2FixedPeriod => {
    const year = getPeriodIdYear(period);
    const periodsInYear = generateSortedPeriodsForYear({
        periodType: period.periodType,
        year,
        calendar,
        locale,
    });
    const periodIndex = periodsInYear.findIndex(periodInYear => periodInYear.id === period.id);

    if (periodIndex > 0) {
        return periodsInYear[periodIndex - 1];
    }

    if (periodIndex === -1) {
        throw new Error(`Could not find period "${period.id}" in ${year}`);
    }

    const previousYearPeriods = generateSortedPeriodsForYear({
        periodType: period.periodType,
        year: year - 1,
        calendar,
        locale,
    });
    const previousPeriod = previousYearPeriods[previousYearPeriods.length - 1];

    if (!previousPeriod) {
        throw new Error(`Could not find the previous period before "${period.id}"`);
    }

    return previousPeriod;
};

export const comparePeriodIds = ({
    a,
    b,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodComparisonOptions): number => {
    const periodA = createFixedPeriodFromPeriodId({ periodId: a, calendar, locale });
    const periodB = createFixedPeriodFromPeriodId({ periodId: b, calendar, locale });
    return compareFixedPeriods(periodA, periodB);
};

export const sortPeriodIds = (
    periodIds: string[],
    options: PeriodEngineOptions,
): string[] => (
    [...periodIds].sort((a, b) => comparePeriodIds({ ...options, a, b }))
);

export const getPeriodsInRange = ({
    startPeriodId,
    endPeriodId,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodRangeOptions): Dhis2FixedPeriod[] => {
    const startPeriod = createFixedPeriodFromPeriodId({ periodId: startPeriodId, calendar, locale });
    const endPeriod = createFixedPeriodFromPeriodId({ periodId: endPeriodId, calendar, locale });

    if (startPeriod.periodType !== endPeriod.periodType) {
        throw new Error(`Period range must use one period type, received "${startPeriod.periodType}" and "${endPeriod.periodType}"`);
    }

    if (compareFixedPeriods(startPeriod, endPeriod) > 0) {
        return [];
    }

    const periods = [startPeriod];
    // The library generates every period of a year to find the ones that follow, so asking for
    // one period at a time costs a year of periods for each period in the range. Ask for a
    // batch instead, and for twice as many each time the end is still ahead.
    let batchSize = FIRST_RANGE_BATCH;

    while (periods[periods.length - 1].id !== endPeriod.id) {
        const currentPeriod = periods[periods.length - 1];
        // Asked for more than a year of periods after the last period of a year, the library
        // starts with that period itself.
        const nextPeriods = getAdjacentFixedPeriods({
            period: currentPeriod,
            steps: batchSize,
            calendar,
            locale,
        }).filter(period => compareFixedPeriods(period, currentPeriod) > 0);

        if (!nextPeriods.length) {
            throw new Error(`Could not generate the next period after "${currentPeriod.id}"`);
        }

        for (const nextPeriod of nextPeriods) {
            if (compareFixedPeriods(nextPeriod, endPeriod) > 0) {
                return periods;
            }

            if (periods.length > MAX_PERIOD_RANGE) {
                throw new Error(`Period range exceeds ${MAX_PERIOD_RANGE} periods`);
            }

            periods.push(nextPeriod);

            if (nextPeriod.id === endPeriod.id) {
                return periods;
            }
        }

        batchSize *= 2;
    }

    return periods;
};

export const getNextPeriodIds = ({
    periodId,
    count,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodCountOptions): string[] => {
    if (count <= 0) {
        return [];
    }

    const period = createFixedPeriodFromPeriodId({ periodId, calendar, locale });
    return getAdjacentFixedPeriods({
        period,
        steps: count,
        calendar,
        locale,
    }).map(nextPeriod => nextPeriod.id);
};

export const getLastNPeriodIds = ({
    periodId,
    count,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodCountOptions): string[] => {
    if (count <= 0) {
        return [];
    }

    const period = createFixedPeriodFromPeriodId({ periodId, calendar, locale });

    const periods = [period];

    while (periods.length < count) {
        periods.unshift(getPreviousFixedPeriod({
            period: periods[0],
            calendar,
            locale,
        }));
    }

    return periods.map(fixedPeriod => fixedPeriod.id);
};
