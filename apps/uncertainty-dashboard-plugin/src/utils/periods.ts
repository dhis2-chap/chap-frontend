import {
    createFixedPeriodFromPeriodId,
    DEFAULT_DHIS2_CALENDAR,
    DEFAULT_DHIS2_LOCALE,
    fromDhis2FixedPeriodType,
    getLastCompletedPeriodId,
    getLastNPeriodIds,
    PERIOD_TYPES,
    toDhis2FixedPeriodType,
} from '@dhis2-chap/core';
import { FALLBACK_PERIOD_COUNTS } from '../constants';
import type { ChartPeriodType } from '../types';

export type SupportedChartPeriodType = typeof PERIOD_TYPES.MONTH | typeof PERIOD_TYPES.WEEK;

type PeriodTypeResult =
    | { status: 'valid'; periodType: SupportedChartPeriodType }
    | { status: 'mixed' }
    | { status: 'unsupported' };

const getChartPeriodTypeFromPeriodId = (
    periodId: string,
): SupportedChartPeriodType | undefined => {
    try {
        const fixedPeriod = createFixedPeriodFromPeriodId({
            periodId,
            calendar: DEFAULT_DHIS2_CALENDAR,
            locale: DEFAULT_DHIS2_LOCALE,
        });

        return fromDhis2FixedPeriodType(fixedPeriod.periodType);
    } catch {
        return undefined;
    }
};

export const inferChartPeriodType = (periodIds: string[]): PeriodTypeResult => {
    const periodTypes = new Set<SupportedChartPeriodType>();

    for (const periodId of periodIds) {
        const periodType = getChartPeriodTypeFromPeriodId(periodId);

        if (!periodType) {
            return { status: 'unsupported' };
        }

        periodTypes.add(periodType);
    }

    if (periodTypes.size > 1) {
        return { status: 'mixed' };
    }

    const [periodType] = Array.from(periodTypes);
    if (!periodType) {
        return { status: 'unsupported' };
    }

    return { status: 'valid', periodType };
};

export const getFallbackPeriods = (periodType: ChartPeriodType): string[] => {
    const dhis2PeriodType = toDhis2FixedPeriodType(periodType);

    if (!dhis2PeriodType) {
        return [];
    }

    const lastCompletedPeriod = getLastCompletedPeriodId({
        periodType: dhis2PeriodType,
        calendar: DEFAULT_DHIS2_CALENDAR,
        locale: DEFAULT_DHIS2_LOCALE,
    });

    return getFallbackPeriodsEndingAt(lastCompletedPeriod, periodType);
};

export const getFallbackPeriodsEndingAt = (
    periodId: string,
    periodType: ChartPeriodType,
): string[] => {
    return getLastNPeriodIds({
        periodId,
        count: FALLBACK_PERIOD_COUNTS[periodType],
        calendar: DEFAULT_DHIS2_CALENDAR,
        locale: DEFAULT_DHIS2_LOCALE,
    });
};
