import { getNowInCalendar } from '@dhis2/multi-calendar-dates';
import {
    DEFAULT_DHIS2_LOCALE,
    DEFAULT_DHIS2_TIME_ZONE,
} from './constants';
import {
    getFixedPeriodByDate,
} from './fixedPeriods';
import { getPreviousFixedPeriod } from './ranges';
import type {
    PeriodEngineOptions,
    PeriodTypeOptions,
} from './types';

// These are calendar-local date parts, not always Gregorian Date values.
const padWithZeroes = (value: number) => String(value).padStart(2, '0');

type TodayInCalendarOptions = Pick<PeriodEngineOptions, 'calendar'> & {
    timeZone?: string;
};

type LastCompletedPeriodOptions = PeriodTypeOptions & {
    date?: string;
    timeZone?: string;
};

export const getTodayInCalendar = ({
    calendar,
    timeZone = DEFAULT_DHIS2_TIME_ZONE,
}: TodayInCalendarOptions): string => {
    const now = getNowInCalendar(calendar, timeZone);
    const year = now.eraYear ?? now.year;
    return `${year}-${padWithZeroes(now.month)}-${padWithZeroes(now.day)}`;
};

export const getLastCompletedPeriodId = ({
    periodType,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
    timeZone = DEFAULT_DHIS2_TIME_ZONE,
    date,
}: LastCompletedPeriodOptions): string => {
    const dateInCalendar = date ?? getTodayInCalendar({ calendar, timeZone });
    const currentPeriod = getFixedPeriodByDate({
        periodType,
        date: dateInCalendar,
        calendar,
        locale,
    });
    const lastCompletedPeriod = getPreviousFixedPeriod({
        period: currentPeriod,
        calendar,
        locale,
    });

    return lastCompletedPeriod.id;
};
