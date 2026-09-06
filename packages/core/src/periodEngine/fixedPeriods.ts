import {
    createFixedPeriodFromPeriodId as createFixedPeriodFromPeriodIdFromLibrary,
    generateFixedPeriods as generateFixedPeriodsFromLibrary,
    getFixedPeriodByDate as getFixedPeriodByDateFromLibrary,
} from '@dhis2/multi-calendar-dates';
import { DEFAULT_DHIS2_LOCALE } from './constants';
import { isDhis2FixedPeriodType } from './guards';
import type {
    Dhis2FixedPeriod,
    PeriodIdOptions,
    PeriodTypeOptions,
} from './types';

const stripLeadingZeroes = (value: string): string => value.replace(/^0+(?=\d)/, '');

export const canonicalizePeriodId = (periodId: string): string => {
    const trimmedPeriodId = periodId.trim();
    const weeklyMatch = trimmedPeriodId.match(/^(\d{4})([A-Z][a-z]{2})?W0*(\d+)$/);

    if (weeklyMatch) {
        const [, year, offset = '', week] = weeklyMatch;
        return `${year}${offset}W${stripLeadingZeroes(week)}`;
    }

    const biWeeklyMatch = trimmedPeriodId.match(/^(\d{4})BiW0*(\d+)$/);

    if (biWeeklyMatch) {
        const [, year, week] = biWeeklyMatch;
        return `${year}BiW${stripLeadingZeroes(week)}`;
    }

    return trimmedPeriodId;
};

export const generateFixedPeriods = ({
    year,
    periodType,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodTypeOptions & { year: number }): Dhis2FixedPeriod[] => {
    if (!isDhis2FixedPeriodType(periodType)) {
        throw new Error(`Unsupported DHIS2 period type "${periodType}"`);
    }

    return generateFixedPeriodsFromLibrary({
        year,
        periodType,
        calendar,
        locale,
    });
};

// The library resolves a period id by generating every period of its year,
// including localized labels through the Temporal polyfill, which costs
// about a millisecond per call. Sort comparators and chart builders resolve
// the same handful of ids thousands of times, so memoize per canonical id.
// Retain the most recently used periods, with a cap for long-lived sessions
// that browse many datasets, calendars, or locales.
const MAX_CACHED_FIXED_PERIODS = 4096;
const fixedPeriodCache = new Map<string, Dhis2FixedPeriod>();

export const createFixedPeriodFromPeriodId = ({
    periodId,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodIdOptions): Dhis2FixedPeriod => {
    const canonicalPeriodId = canonicalizePeriodId(periodId);
    const cacheKey = `${calendar}|${locale}|${canonicalPeriodId}`;
    const cachedPeriod = fixedPeriodCache.get(cacheKey);

    if (cachedPeriod) {
        fixedPeriodCache.delete(cacheKey);
        fixedPeriodCache.set(cacheKey, cachedPeriod);
        return cachedPeriod;
    }

    const period = createFixedPeriodFromPeriodIdFromLibrary({
        periodId: canonicalPeriodId,
        calendar,
        locale,
    });
    fixedPeriodCache.set(cacheKey, period);
    if (fixedPeriodCache.size > MAX_CACHED_FIXED_PERIODS) {
        const oldestKey = fixedPeriodCache.keys().next().value;
        if (oldestKey !== undefined) fixedPeriodCache.delete(oldestKey);
    }

    return period;
};

export const getFixedPeriodByDate = ({
    periodType,
    date,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodTypeOptions & { date: string }): Dhis2FixedPeriod => {
    if (!isDhis2FixedPeriodType(periodType)) {
        throw new Error(`Unsupported DHIS2 period type "${periodType}"`);
    }

    return getFixedPeriodByDateFromLibrary({
        periodType,
        date,
        calendar,
        locale,
    });
};

export const compareFixedPeriods = (
    a: Dhis2FixedPeriod,
    b: Dhis2FixedPeriod,
): number => {
    const startDateComparison = a.startDate.localeCompare(b.startDate);

    if (startDateComparison !== 0) {
        return startDateComparison;
    }

    return a.endDate.localeCompare(b.endDate);
};
