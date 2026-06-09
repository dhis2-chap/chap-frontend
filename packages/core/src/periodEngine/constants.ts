import {
    constants as libraryConstants,
    periodTypes as libraryPeriodTypes,
} from '@dhis2/multi-calendar-dates';
import type { Dhis2Calendar } from './types';

export const DEFAULT_DHIS2_CALENDAR = 'gregory';
export const DEFAULT_DHIS2_LOCALE = 'en';
export const DEFAULT_DHIS2_TIME_ZONE = 'UTC';
export const MAX_PERIOD_RANGE = 50000;

export const dhis2SupportedCalendars = libraryConstants.calendars;

export const dhis2CalendarSettingMap = {
    ethiopian: 'ethiopic',
    coptic: 'coptic',
    gregorian: 'gregory',
    islamic: 'islamic',
    iso8601: 'iso8601',
    nepali: 'nepali',
    thai: 'buddhist',
    persian: 'persian',
} satisfies Record<string, Dhis2Calendar>;

export const dhis2FixedPeriodTypes = libraryPeriodTypes;
