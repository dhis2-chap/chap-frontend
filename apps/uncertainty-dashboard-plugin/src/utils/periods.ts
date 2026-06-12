import {
    DEFAULT_DHIS2_CALENDAR,
    DEFAULT_DHIS2_LOCALE,
    getLastCompletedPeriodId,
    getLastNPeriodIds,
    PERIOD_TYPES,
} from '@dhis2-chap/core';
import { FALLBACK_MONTH_COUNT } from '@/constants';

type SupportedChartPeriodType = typeof PERIOD_TYPES.MONTH | typeof PERIOD_TYPES.WEEK;

type PeriodTypeResult =
    | { status: 'valid'; periodType: SupportedChartPeriodType }
    | { status: 'mixed' }
    | { status: 'unsupported' };

const isMonthlyPeriodId = (periodId: string) => /^\d{4}(0[1-9]|1[0-2])$/.test(periodId);
const isWeeklyPeriodId = (periodId: string) => /^\d{4}W(0[1-9]|[1-4]\d|5[0-3])$/.test(periodId);

export const inferChartPeriodType = (periodIds: string[]): PeriodTypeResult => {
    const periodTypes = new Set<SupportedChartPeriodType>();

    for (const periodId of periodIds) {
        if (isMonthlyPeriodId(periodId)) {
            periodTypes.add(PERIOD_TYPES.MONTH);
        } else if (isWeeklyPeriodId(periodId)) {
            periodTypes.add(PERIOD_TYPES.WEEK);
        } else {
            return { status: 'unsupported' };
        }
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

export const getFallbackMonthlyPeriods = (): string[] => {
    const lastCompletedMonthlyPeriod = getLastCompletedPeriodId({
        periodType: 'MONTHLY',
        calendar: DEFAULT_DHIS2_CALENDAR,
        locale: DEFAULT_DHIS2_LOCALE,
    });

    return getFallbackMonthlyPeriodsEndingAt(lastCompletedMonthlyPeriod);
};

export const getFallbackMonthlyPeriodsEndingAt = (periodId: string): string[] => {
    return getLastNPeriodIds({
        periodId,
        count: FALLBACK_MONTH_COUNT,
        calendar: DEFAULT_DHIS2_CALENDAR,
        locale: DEFAULT_DHIS2_LOCALE,
    });
};
