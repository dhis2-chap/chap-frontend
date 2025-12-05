import { PERIOD_TYPES } from '@/components/ModelExecutionForm/constants';
import {
    parse,
    format,
    addMonths,
    addWeeks,
    subMonths,
    subWeeks,
    startOfISOWeek,
    endOfISOWeek,
    startOfMonth,
    endOfMonth,
    getISOWeek,
    isAfter,
    isSameMonth,
    isSameYear,
    isValid,
    getISOWeekYear,
} from 'date-fns';

export interface Period {
    startDate: Date | undefined;
    endDate: Date | undefined;
    id: string;
}

export const toDHIS2PeriodData = (start: string, end: string, periodType: string): Period[] => {
    if (periodType === 'week') return getWeeks(start, end);
    if (periodType === 'month') return getMonths(start, end);
    console.error('Invalid period type:', periodType);
    return [];
};

// This function takes in a start and end string in the format of "2024-W01" and returns an array of Period objects
const getWeeks = (start: string, end: string): Period[] => {
    try {
        // Parse ISO week format (e.g., "2024-W01")
        const startDate = parse(start, 'RRRR-\'W\'II', new Date());
        const endDate = parse(end, 'RRRR-\'W\'II', new Date());

        if (!isValid(startDate) || !isValid(endDate)) {
            console.error('Invalid date format provided for weeks:', { start, end });
            return [];
        }

        const yearDifference = getISOWeekYear(endDate) - getISOWeekYear(startDate);
        if (yearDifference > 100) {
            return [];
        }

        const weeks: Period[] = [];
        let currentDate = startOfISOWeek(startDate);
        const endWeekStart = startOfISOWeek(endDate);

        while (!isAfter(currentDate, endWeekStart)) {
            const isoYear = getISOWeekYear(currentDate);
            const weekNumber = getISOWeek(currentDate);
            const weekString = `${isoYear}W${String(weekNumber)}`;

            const weekStart = startOfISOWeek(currentDate);
            const weekEnd = endOfISOWeek(currentDate);

            weeks.push({
                endDate: new Date(format(weekEnd, 'yyyy-MM-dd')),
                startDate: new Date(format(weekStart, 'yyyy-MM-dd')),
                id: weekString,
            });

            currentDate = addWeeks(currentDate, 1);
        }

        return weeks;
    } catch (error) {
        console.error('Error parsing week dates:', error);
        return [];
    }
};

// This function takes in a start and end string in the format of "2024-01" and returns an array of Period objects
const getMonths = (start: string, end: string): Period[] => {
    try {
        // Parse month format (e.g., "2024-01")
        const startDate = parse(start, 'yyyy-MM', new Date());
        const endDate = parse(end, 'yyyy-MM', new Date());

        // Check if parsed dates are valid
        if (!isValid(startDate) || !isValid(endDate)) {
            console.error('Invalid date format provided for months:', { start, end });
            return [];
        }

        // Safety check for unreasonable date ranges
        const yearDifference = endDate.getFullYear() - startDate.getFullYear();
        if (yearDifference > 100) {
            return [];
        }

        const months: Period[] = [];
        let currentDate = startDate;

        while (
            isAfter(endDate, currentDate)
            || (isSameYear(currentDate, endDate) && isSameMonth(currentDate, endDate))
        ) {
            const monthId = format(currentDate, 'yyyyMM');

            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);

            months.push({
                id: monthId,
                endDate: new Date(format(monthEnd, 'yyyy-MM-dd')),
                startDate: new Date(format(monthStart, 'yyyy-MM-dd')),
            });

            currentDate = addMonths(currentDate, 1);
        }

        return months;
    } catch (error) {
        console.error('Error parsing month dates:', error);
        return [];
    }
};

// convert a basic ISO format to an extended ISO format
// i.e. 202001 to 2020-01
export const convertServerToClientPeriod = (periodId: string, periodType: keyof typeof PERIOD_TYPES): string => {
    try {
        if (periodType.toUpperCase() === PERIOD_TYPES.MONTH) {
            const parsedMonth = parse(periodId, 'yyyyMM', new Date());

            if (!isValid(parsedMonth)) {
                console.error('Invalid month period id provided:', periodId);
                return periodId;
            }

            return format(parsedMonth, 'yyyy-MM');
        }

        if (periodType.toUpperCase() === PERIOD_TYPES.WEEK) {
            const parsedWeek = parse(periodId, 'RRRR\'W\'II', new Date());

            if (!isValid(parsedWeek)) {
                console.error('Invalid week period id provided:', periodId);
                return periodId;
            }

            return format(parsedWeek, 'RRRR-\'W\'II');
        }

        console.error('Unsupported period type provided:', periodType);
        return periodId;
    } catch (error) {
        console.error('Failed to convert period id to extended ISO8601 format:', error);
        return periodId;
    }
};

export const sortSplitPeriods = (splitPeriods: string[], periodType: keyof typeof PERIOD_TYPES): string[] => {
    if (periodType.toUpperCase() === PERIOD_TYPES.MONTH) {
        return splitPeriods.sort((a, b) => {
            const dateA = parse(a, 'yyyyMM', new Date());
            const dateB = parse(b, 'yyyyMM', new Date());
            return dateA.getTime() - dateB.getTime();
        });
    }
    if (periodType.toUpperCase() === PERIOD_TYPES.WEEK) {
        return splitPeriods.sort((a, b) => {
            const dateA = parse(a, 'RRRR-\'W\'II', new Date());
            const dateB = parse(b, 'RRRR-\'W\'II', new Date());
            return dateA.getTime() - dateB.getTime();
        });
    }

    console.error('Unsupported period type provided:', periodType);
    return splitPeriods;
};

// Get the last N periods including the base period in server format
// e.g. getLastNPeriods('202412', 'MONTH', 12) returns ['202401', '202402', ..., '202412']
export const getLastNPeriods = (
    basePeriod: string,
    periodType: keyof typeof PERIOD_TYPES,
    count: number,
): string[] => {
    try {
        if (count <= 0) {
            console.error('Count must be greater than 0');
            return [];
        }

        if (periodType.toUpperCase() === PERIOD_TYPES.MONTH) {
            const baseDate = parse(basePeriod, 'yyyyMM', new Date());

            if (!isValid(baseDate)) {
                console.error('Invalid month period id provided:', basePeriod);
                return [];
            }

            const periods: string[] = [];
            const startDate = subMonths(baseDate, count - 1);

            let currentDate = startDate;
            for (let i = 0; i < count; i++) {
                periods.push(format(currentDate, 'yyyyMM'));
                currentDate = addMonths(currentDate, 1);
            }

            return periods;
        }

        if (periodType.toUpperCase() === PERIOD_TYPES.WEEK) {
            const baseDate = parse(basePeriod, 'RRRR\'W\'II', new Date());

            if (!isValid(baseDate)) {
                console.error('Invalid week period id provided:', basePeriod);
                return [];
            }

            const periods: string[] = [];
            const startDate = subWeeks(startOfISOWeek(baseDate), count - 1);

            let currentDate = startDate;
            for (let i = 0; i < count; i++) {
                const isoYear = getISOWeekYear(currentDate);
                const weekNumber = getISOWeek(currentDate);
                const weekString = `${isoYear}W${String(weekNumber).padStart(2, '0')}`;
                periods.push(weekString);
                currentDate = addWeeks(currentDate, 1);
            }

            return periods;
        }

        console.error('Unsupported period type provided:', periodType);
        return [];
    } catch (error) {
        console.error('Error generating last N periods:', error);
        return [];
    }
};
