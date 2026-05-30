import {
    createFixedPeriodFromPeriodId as createFixedPeriodFromPeriodIdFromLibrary,
    generateFixedPeriods as generateFixedPeriodsFromLibrary,
} from '@dhis2/multi-calendar-dates';

type LibraryPeriodGenerationOptions = Parameters<typeof generateFixedPeriodsFromLibrary>[0];

export type Dhis2Calendar = LibraryPeriodGenerationOptions['calendar'];
export type Dhis2FixedPeriodType = LibraryPeriodGenerationOptions['periodType'];
export type Dhis2FixedPeriod = ReturnType<typeof createFixedPeriodFromPeriodIdFromLibrary>;

export type PeriodEngineOptions = {
    calendar: Dhis2Calendar;
    locale?: string;
};

export type PeriodTypeOptions = PeriodEngineOptions & {
    periodType: Dhis2FixedPeriodType;
};

export type PeriodIdOptions = PeriodEngineOptions & {
    periodId: string;
};
