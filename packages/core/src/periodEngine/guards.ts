import { PERIOD_TYPES } from '../timePeriodUtils';
import {
    DEFAULT_DHIS2_CALENDAR,
    dhis2CalendarSettingMap,
    dhis2FixedPeriodTypes,
    dhis2SupportedCalendars,
} from './constants';
import type { Dhis2Calendar, Dhis2FixedPeriodType } from './types';

const dhis2SupportedCalendarSet: ReadonlySet<string> = new Set(dhis2SupportedCalendars);
const dhis2FixedPeriodTypeSet: ReadonlySet<string> = new Set(dhis2FixedPeriodTypes);

type Dhis2CalendarSetting = keyof typeof dhis2CalendarSettingMap;

const isDhis2CalendarSetting = (value: string): value is Dhis2CalendarSetting => (
    Object.prototype.hasOwnProperty.call(dhis2CalendarSettingMap, value)
);

export const isSupportedDhis2Calendar = (value: unknown): value is Dhis2Calendar => (
    typeof value === 'string' && dhis2SupportedCalendarSet.has(value)
);

export const normalizeDhis2CalendarSetting = (
    value: string | null | undefined,
): Dhis2Calendar => {
    if (!value) {
        return DEFAULT_DHIS2_CALENDAR;
    }

    const normalized = value.toLowerCase();
    const calendar = isDhis2CalendarSetting(normalized)
        ? dhis2CalendarSettingMap[normalized]
        : normalized;

    if (isSupportedDhis2Calendar(calendar)) {
        return calendar;
    }

    throw new Error(`Unsupported DHIS2 calendar "${value}"`);
};

export const isDhis2FixedPeriodType = (value: unknown): value is Dhis2FixedPeriodType => (
    typeof value === 'string' && dhis2FixedPeriodTypeSet.has(value)
);

export const toDhis2FixedPeriodType = (
    periodType: string | null | undefined,
): Dhis2FixedPeriodType | undefined => {
    const normalized = periodType?.toUpperCase();

    if (normalized === PERIOD_TYPES.MONTH) {
        return 'MONTHLY';
    }

    if (normalized === PERIOD_TYPES.WEEK) {
        return 'WEEKLY';
    }

    if (isDhis2FixedPeriodType(normalized)) {
        return normalized;
    }

    return undefined;
};

export const fromDhis2FixedPeriodType = (
    periodType: Dhis2FixedPeriodType,
): typeof PERIOD_TYPES.MONTH | typeof PERIOD_TYPES.WEEK | undefined => {
    if (periodType === 'MONTHLY') {
        return PERIOD_TYPES.MONTH;
    }

    if (periodType === 'WEEKLY') {
        return PERIOD_TYPES.WEEK;
    }

    return undefined;
};
