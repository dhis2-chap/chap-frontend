import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';
import {
    DEFAULT_DHIS2_CALENDAR,
    DEFAULT_DHIS2_LOCALE,
    DEFAULT_DHIS2_TIME_ZONE,
    type Dhis2Calendar,
    normalizeDhis2CalendarSetting,
} from '@dhis2-chap/core';
import { useExperimentalFeature, FEATURES } from '@/features/settings/Experimental';

export type Dhis2PeriodSettings = {
    calendar: Dhis2Calendar;
    locale: string;
    timeZone: string;
};

type SystemSettingsResponse = {
    keyCalendar?: string | null;
    keyUiLocale?: string | null;
    keyDbLocale?: string | null;
};

const normalizeLocaleSetting = (locale: string | null | undefined): string => (
    locale?.replace(/_/g, '-') || DEFAULT_DHIS2_LOCALE
);

export const DEFAULT_PERIOD_SETTINGS: Dhis2PeriodSettings = {
    calendar: DEFAULT_DHIS2_CALENDAR,
    locale: DEFAULT_DHIS2_LOCALE,
    timeZone: DEFAULT_DHIS2_TIME_ZONE,
};

export const useDhis2PeriodSettings = () => {
    const dataEngine = useDataEngine();
    const { enabled: calendarOverrideEnabled } = useExperimentalFeature(FEATURES.DHIS2_CALENDAR);

    const query = useQuery<Dhis2PeriodSettings, Error>({
        queryKey: ['dhis2-period-settings'],
        queryFn: async () => {
            const response = await dataEngine.query({
                systemSettings: {
                    resource: 'systemSettings',
                },
            });
            const settings = response.systemSettings as SystemSettingsResponse;

            return {
                calendar: normalizeDhis2CalendarSetting(settings.keyCalendar),
                locale: normalizeLocaleSetting(settings.keyUiLocale || settings.keyDbLocale),
                timeZone: DEFAULT_DHIS2_TIME_ZONE,
            };
        },
    });

    const settings = query.data ?? DEFAULT_PERIOD_SETTINGS;

    const effectiveSettings: Dhis2PeriodSettings = calendarOverrideEnabled
        ? settings
        : { ...settings, calendar: DEFAULT_DHIS2_CALENDAR as Dhis2Calendar };

    return {
        settings: effectiveSettings,
        isLoading: query.isLoading,
        error: query.error ?? null,
    };
};
