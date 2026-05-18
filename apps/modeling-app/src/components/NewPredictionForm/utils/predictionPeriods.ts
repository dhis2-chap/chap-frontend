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
import {
    PERIOD_TYPES,
    comparePeriods,
    convertServerToClientPeriod,
} from '@dhis2-chap/ui';

export type SupportedPeriodType = typeof PERIOD_TYPES.MONTH | typeof PERIOD_TYPES.WEEK;

const formatMonth = (date: Date): string => format(date, 'yyyyMM');

const formatWeek = (date: Date): string => {
    const isoYear = getISOWeekYear(date);
    const weekNumber = getISOWeek(date);
    return `${isoYear}W${String(weekNumber).padStart(2, '0')}`;
};

export const getLastCompletedPeriod = (
    periodType: SupportedPeriodType,
    now: Date = new Date(),
): string => {
    if (periodType === PERIOD_TYPES.MONTH) {
        return formatMonth(subDays(startOfMonth(now), 1));
    }
    return formatWeek(subDays(startOfISOWeek(now), 1));
};

const parsePeriod = (period: string, periodType: SupportedPeriodType): Date | null => {
    if (periodType === PERIOD_TYPES.MONTH) {
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

export const shiftPeriod = (
    period: string,
    periodType: SupportedPeriodType,
    delta: number,
): string | null => {
    const parsed = parsePeriod(period, periodType);
    if (!parsed) {
        return null;
    }
    if (periodType === PERIOD_TYPES.MONTH) {
        return formatMonth(addMonths(parsed, delta));
    }
    return formatWeek(addWeeks(startOfISOWeek(parsed), delta));
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
    if (periodType === PERIOD_TYPES.MONTH) {
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
