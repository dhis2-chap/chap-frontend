import {
    addMonths,
    addWeeks,
    format,
    getISOWeek,
    getISOWeekYear,
    isValid,
    parse,
    startOfISOWeek,
    startOfMonth,
    subDays,
} from 'date-fns';
import { comparePeriods, convertServerToClientPeriod, PERIOD_TYPES } from '@dhis2-chap/core';
import {
    isSupportedPeriodType,
    parseSupportedPeriodType,
    SUPPORTED_PERIOD_TYPES,
    type SupportedPeriodType,
} from './supportedPeriodType';

export type { SupportedPeriodType };
export { isSupportedPeriodType, parseSupportedPeriodType, SUPPORTED_PERIOD_TYPES };

const formatMonth = (date: Date): string => format(date, 'yyyyMM');

const formatWeek = (date: Date, padWeek = true): string => {
    const isoYear = getISOWeekYear(date);
    const weekNumber = String(getISOWeek(date));
    return `${isoYear}W${padWeek ? weekNumber.padStart(2, '0') : weekNumber}`;
};

export const parsePeriod = (
    period: string,
    periodType: SupportedPeriodType,
): Date | null => {
    if (periodType === SUPPORTED_PERIOD_TYPES.MONTH) {
        const parsed = parse(period, 'yyyyMM', new Date());
        return isValid(parsed) ? parsed : null;
    }

    const weekMatch = period.match(/^(\d{4})W(\d{1,2})$/);
    if (!weekMatch) {
        return null;
    }

    const [, year, week] = weekMatch;
    const parsed = parse(`${year}-W${week.padStart(2, '0')}`, 'RRRR-\'W\'II', new Date());
    return isValid(parsed) ? parsed : null;
};

export const getLastCompletedPeriod = (
    periodType: SupportedPeriodType,
    now: Date = new Date(),
): string => {
    if (periodType === SUPPORTED_PERIOD_TYPES.MONTH) {
        return formatMonth(subDays(startOfMonth(now), 1));
    }

    return formatWeek(subDays(startOfISOWeek(now), 1));
};

export const shiftPeriod = (
    period: string,
    periodType: SupportedPeriodType,
    delta: number,
): string | null => {
    const parsed = parsePeriod(period, periodType);
    if (!parsed) {
        return null;
    }

    if (periodType === SUPPORTED_PERIOD_TYPES.MONTH) {
        return formatMonth(addMonths(parsed, delta));
    }

    return formatWeek(addWeeks(startOfISOWeek(parsed), delta));
};

export const getNextPeriods = (
    lastPeriod: string | undefined | null,
    periodType: string | undefined | null,
    count: number | undefined | null,
): string[] => {
    if (!lastPeriod || !count || count <= 0) {
        return [];
    }

    const normalizedPeriodType = parseSupportedPeriodType(periodType);
    if (!normalizedPeriodType) {
        return [];
    }

    if (normalizedPeriodType === SUPPORTED_PERIOD_TYPES.MONTH) {
        const lastPeriodDate = parsePeriod(lastPeriod, normalizedPeriodType);
        if (!lastPeriodDate) {
            return [];
        }

        return Array.from({ length: count }, (_, index) => (
            formatMonth(addMonths(lastPeriodDate, index + 1))
        ));
    }

    const weekMatch = lastPeriod.match(/^(\d{4})W(\d{1,2})$/);
    if (!weekMatch) {
        return [];
    }

    const [, , week] = weekMatch;
    const lastPeriodDate = parsePeriod(lastPeriod, normalizedPeriodType);
    if (!lastPeriodDate) {
        return [];
    }

    const padWeek = week.length > 1;
    const startDate = addWeeks(startOfISOWeek(lastPeriodDate), 1);

    return Array.from({ length: count }, (_, index) => {
        const date = addWeeks(startDate, index);
        return formatWeek(date, padWeek);
    });
};

export const formatPeriodId = (periodId: string | undefined | null) => {
    if (!periodId) {
        return undefined;
    }

    const monthDate = parse(periodId, 'yyyyMM', new Date());
    if (/^\d{6}$/.test(periodId) && isValid(monthDate)) {
        return format(monthDate, 'MMMM yyyy');
    }

    const weekMatch = periodId.match(/^(\d{4})W(\d{1,2})$/);
    if (weekMatch) {
        const [, year, week] = weekMatch;
        const weekDate = parse(
            `${year}-W${week.padStart(2, '0')}`,
            'RRRR-\'W\'II',
            new Date(),
        );

        if (isValid(weekDate)) {
            return `Week ${Number(week)}, ${year}`;
        }
    }

    return periodId;
};

export const periodToInputValue = (
    period: string,
    periodType: SupportedPeriodType,
): string => convertServerToClientPeriod(period, periodType);

export const inputValueToPeriod = (
    value: string,
    periodType: SupportedPeriodType,
): string | null => {
    if (!value) {
        return null;
    }

    if (periodType === SUPPORTED_PERIOD_TYPES.MONTH) {
        const parsed = parse(value, 'yyyy-MM', new Date());
        return isValid(parsed) ? formatMonth(parsed) : null;
    }

    const parsed = parse(value, 'RRRR-\'W\'II', new Date());
    return isValid(parsed) ? formatWeek(parsed) : null;
};

export const isPeriodBefore = (
    a: string,
    b: string,
    periodType: SupportedPeriodType,
): boolean => comparePeriods(a, b, periodType) < 0;

export const isPeriodAfter = (
    a: string,
    b: string,
    periodType: SupportedPeriodType,
): boolean => comparePeriods(a, b, periodType) > 0;

export const PERIOD_TYPE_FALLBACK = PERIOD_TYPES.MONTH;
