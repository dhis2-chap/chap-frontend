import {
    parse,
    format,
    addMonths,
    addWeeks,
    subMonths,
    subWeeks,
    startOfISOWeek,
    getISOWeek,
    isValid,
    getISOWeekYear,
} from 'date-fns';

export const PERIOD_TYPES = {
    DAY: 'DAY',
    WEEK: 'WEEK',
    MONTH: 'MONTH',
    YEAR: 'YEAR',
    ANY: 'ANY',
} as const;

export type PeriodType = typeof PERIOD_TYPES[keyof typeof PERIOD_TYPES];

// This page seems ai-generated, but it's actually a result of hard manual labour.

/**
 * Converts a basic ISO format period to an extended ISO format.
 * @param periodId - The period ID in basic format (e.g., "202001" for months, "2024W01" for weeks)
 * @param periodType - The type of period ('month' or 'week')
 * @returns The period ID in extended format (e.g., "2020-01" for months, "2024-W01" for weeks)
 * @example
 * convertServerToClientPeriod('202001', PERIOD_TYPES.MONTH) // returns '2020-01'
 * convertServerToClientPeriod('2024W01', PERIOD_TYPES.WEEK) // returns '2024-W01'
 */
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

/**
 * Compares two period strings for sorting.
 * @param a - The first period string to compare
 * @param b - The second period string to compare
 * @param periodType - The type of period ('month' or 'week')
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export const comparePeriods = (a: string, b: string, periodType: keyof typeof PERIOD_TYPES): number => {
    if (periodType.toUpperCase() === PERIOD_TYPES.MONTH) {
        const dateA = parse(a, 'yyyyMM', new Date());
        const dateB = parse(b, 'yyyyMM', new Date());

        if (!isValid(dateA)) console.error('Invalid month period id provided:', a);
        if (!isValid(dateB)) console.error('Invalid month period id provided:', b);

        return dateA.getTime() - dateB.getTime();
    }
    if (periodType.toUpperCase() === PERIOD_TYPES.WEEK) {
        const dateA = parse(a, 'RRRR\'W\'II', new Date());
        const dateB = parse(b, 'RRRR\'W\'II', new Date());

        if (!isValid(dateA)) console.error('Invalid week period id provided:', a);
        if (!isValid(dateB)) console.error('Invalid week period id provided:', b);

        return dateA.getTime() - dateB.getTime();
    }

    console.error('Unsupported period type provided:', periodType);
    return a.localeCompare(b);
};

/**
 * Sorts period strings chronologically based on the period type.
 * @param periods - An array of period strings to sort
 * @param periodType - The type of period ('month' or 'week')
 * @returns A new array with the periods sorted chronologically
 */
export const sortPeriods = (periods: string[], periodType: keyof typeof PERIOD_TYPES): string[] => {
    return [...periods].sort((a, b) => comparePeriods(a, b, periodType));
};

/**
 * Gets the last N periods including the base period in server format.
 * @param basePeriod - The base period to count back from (e.g., "202412" for months, "2024W52" for weeks)
 * @param periodType - The type of period ('month' or 'week')
 * @param count - The number of periods to return (including the base period)
 * @returns An array of period strings in chronological order
 * @example
 * getLastNPeriods('202412', 'MONTH', 12) // returns ['202401', '202402', ..., '202412']
 */
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
