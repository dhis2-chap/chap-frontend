import {
    createFixedPeriodFromPeriodId as createFixedPeriodFromPeriodIdFromLibrary,
    generateFixedPeriods as generateFixedPeriodsFromLibrary,
    getAdjacentFixedPeriods as getAdjacentFixedPeriodsFromLibrary,
    getFixedPeriodByDate as getFixedPeriodByDateFromLibrary,
    getNowInCalendar,
    periodTypes as libraryPeriodTypes,
} from '@dhis2/multi-calendar-dates';
import { PERIOD_TYPES } from './timePeriodUtils';

export const DEFAULT_DHIS2_CALENDAR = 'gregory';
export const DEFAULT_DHIS2_LOCALE = 'en';
export const DEFAULT_DHIS2_TIME_ZONE = 'UTC';
export const MAX_PERIOD_RANGE = 50000;

export const dhis2SupportedCalendars = [
    'iso8601',
    'hebrew',
    'islamic',
    'islamic-umalqura',
    'islamic-tbla',
    'islamic-civil',
    'islamic-rgsa',
    'persian',
    'ethiopic',
    'ethioaa',
    'coptic',
    'chinese',
    'dangi',
    'roc',
    'indian',
    'buddhist',
    'japanese',
    'gregory',
    'nepali',
] as const;

export const dhis2CalendarSettingMap = {
    ethiopian: 'ethiopic',
    coptic: 'coptic',
    gregorian: 'gregory',
    islamic: 'islamic',
    iso8601: 'iso8601',
    nepali: 'nepali',
    thai: 'buddhist',
    persian: 'persian',
} as const;

export const dhis2FixedPeriodTypes = libraryPeriodTypes;

export type Dhis2Calendar = typeof dhis2SupportedCalendars[number];
export type Dhis2FixedPeriodType = typeof libraryPeriodTypes[number];

export type Dhis2FixedPeriod = {
    periodType: Dhis2FixedPeriodType;
    id: string;
    iso?: string;
    name: string;
    displayName: string;
    startDate: string;
    endDate: string;
};

type PeriodEngineOptions = {
    calendar: Dhis2Calendar;
    locale?: string;
};

type PeriodGenerationOptions = PeriodEngineOptions & {
    periodType: Dhis2FixedPeriodType;
    year: number;
};

type PeriodIdOptions = PeriodEngineOptions & {
    periodId: string;
};

type PeriodDateOptions = PeriodEngineOptions & {
    periodType: Dhis2FixedPeriodType;
    date: string;
};

type AdjacentPeriodOptions = PeriodEngineOptions & {
    period: Dhis2FixedPeriod;
    steps: number;
};

type PeriodRangeOptions = PeriodEngineOptions & {
    startPeriodId: string;
    endPeriodId: string;
};

type PeriodComparisonOptions = PeriodEngineOptions & {
    a: string;
    b: string;
};

type GetLastCompletedPeriodOptions = PeriodEngineOptions & {
    periodType: Dhis2FixedPeriodType;
    date?: string;
    timeZone?: string;
};

type GetNextPeriodIdsOptions = PeriodEngineOptions & {
    periodId: string;
    count: number;
};

type GetLastNPeriodIdsOptions = PeriodEngineOptions & {
    periodId: string;
    count: number;
};

const padWithZeroes = (value: number) => String(value).padStart(2, '0');

export const isSupportedDhis2Calendar = (value: unknown): value is Dhis2Calendar => (
    typeof value === 'string' && dhis2SupportedCalendars.includes(value as Dhis2Calendar)
);

export const normalizeDhis2CalendarSetting = (
    value: string | null | undefined,
): Dhis2Calendar => {
    if (!value) {
        return DEFAULT_DHIS2_CALENDAR;
    }

    const normalized = value.toLowerCase();
    const mappedCalendar = dhis2CalendarSettingMap[normalized as keyof typeof dhis2CalendarSettingMap];
    const calendar = mappedCalendar ?? normalized;

    if (isSupportedDhis2Calendar(calendar)) {
        return calendar;
    }

    throw new Error(`Unsupported DHIS2 calendar "${value}"`);
};

export const isDhis2FixedPeriodType = (value: unknown): value is Dhis2FixedPeriodType => (
    typeof value === 'string' && libraryPeriodTypes.includes(value as Dhis2FixedPeriodType)
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

export const canonicalizePeriodId = (periodId: string): string => {
    const trimmedPeriodId = periodId.trim();
    const weeklyMatch = trimmedPeriodId.match(/^(\d{4})([A-Z][a-z]{2})?W0*(\d+)$/);

    if (weeklyMatch) {
        const [, year, offset = '', week] = weeklyMatch;
        return `${year}${offset}W${Number(week)}`;
    }

    const biWeeklyMatch = trimmedPeriodId.match(/^(\d{4})BiW0*(\d+)$/);

    if (biWeeklyMatch) {
        const [, year, week] = biWeeklyMatch;
        return `${year}BiW${Number(week)}`;
    }

    return trimmedPeriodId;
};

export const generateFixedPeriods = ({
    year,
    periodType,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodGenerationOptions): Dhis2FixedPeriod[] => {
    if (!isDhis2FixedPeriodType(periodType)) {
        throw new Error(`Unsupported DHIS2 period type "${periodType}"`);
    }

    return generateFixedPeriodsFromLibrary({
        year,
        periodType,
        calendar,
        locale,
    }) as Dhis2FixedPeriod[];
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
    }) as Dhis2FixedPeriod
);

export const getFixedPeriodByDate = ({
    periodType,
    date,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: PeriodDateOptions): Dhis2FixedPeriod => {
    if (!isDhis2FixedPeriodType(periodType)) {
        throw new Error(`Unsupported DHIS2 period type "${periodType}"`);
    }

    return getFixedPeriodByDateFromLibrary({
        periodType,
        date,
        calendar,
        locale,
    }) as Dhis2FixedPeriod;
};

export const getAdjacentFixedPeriods = ({
    period,
    steps,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: AdjacentPeriodOptions): Dhis2FixedPeriod[] => (
    getAdjacentFixedPeriodsFromLibrary({
        period,
        steps,
        calendar,
        locale,
    }) as Dhis2FixedPeriod[]
);

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
    let currentPeriod = startPeriod;

    while (currentPeriod.id !== endPeriod.id) {
        if (periods.length > MAX_PERIOD_RANGE) {
            throw new Error(`Period range exceeds ${MAX_PERIOD_RANGE} periods`);
        }

        const [nextPeriod] = getAdjacentFixedPeriods({
            period: currentPeriod,
            steps: 1,
            calendar,
            locale,
        });

        if (!nextPeriod || nextPeriod.id === currentPeriod.id) {
            throw new Error(`Could not generate the next period after "${currentPeriod.id}"`);
        }

        if (compareFixedPeriods(nextPeriod, endPeriod) > 0) {
            break;
        }

        periods.push(nextPeriod);
        currentPeriod = nextPeriod;
    }

    return periods;
};

export const getPeriodIdsInRange = (options: PeriodRangeOptions): string[] => (
    getPeriodsInRange(options).map(period => period.id)
);

export const getTodayInCalendar = ({
    calendar,
    timeZone = DEFAULT_DHIS2_TIME_ZONE,
}: Pick<GetLastCompletedPeriodOptions, 'calendar' | 'timeZone'>): string => {
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
}: GetLastCompletedPeriodOptions): string => {
    const dateInCalendar = date ?? getTodayInCalendar({ calendar, timeZone });
    const currentPeriod = getFixedPeriodByDate({
        periodType,
        date: dateInCalendar,
        calendar,
        locale,
    });
    const [lastCompletedPeriod] = getAdjacentFixedPeriods({
        period: currentPeriod,
        steps: -1,
        calendar,
        locale,
    });

    if (!lastCompletedPeriod) {
        throw new Error(`Could not find the last completed period before "${currentPeriod.id}"`);
    }

    return lastCompletedPeriod.id;
};

export const getNextPeriodIds = ({
    periodId,
    count,
    calendar,
    locale = DEFAULT_DHIS2_LOCALE,
}: GetNextPeriodIdsOptions): string[] => {
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
}: GetLastNPeriodIdsOptions): string[] => {
    if (count <= 0) {
        return [];
    }

    const period = createFixedPeriodFromPeriodId({ periodId, calendar, locale });

    if (count === 1) {
        return [period.id];
    }

    return [
        ...getAdjacentFixedPeriods({
            period,
            steps: -(count - 1),
            calendar,
            locale,
        }),
        period,
    ]
        .sort(compareFixedPeriods)
        .map(fixedPeriod => fixedPeriod.id);
};
