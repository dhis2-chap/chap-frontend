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

export const createFixedPeriodFromPeriodId = ({
    periodId,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodIdOptions): Dhis2FixedPeriod => (
    createFixedPeriodFromPeriodIdFromLibrary({
        periodId: canonicalizePeriodId(periodId),
        calendar,
        locale,
    })
);

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
