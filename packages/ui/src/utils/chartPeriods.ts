import {
    canonicalizePeriodId,
    comparePeriodIds,
    DEFAULT_DHIS2_CALENDAR,
    DEFAULT_DHIS2_LOCALE,
} from '@dhis2-chap/core';

export const safeComparePeriodIds = (a: string, b: string): number => {
    try {
        return comparePeriodIds({
            a,
            b,
            calendar: DEFAULT_DHIS2_CALENDAR,
            locale: DEFAULT_DHIS2_LOCALE,
        });
    } catch {
        return a.localeCompare(b);
    }
};

export const buildChartPeriods = (periodIds: string[]): string[] => {
    const periodsByCanonicalId = new Map<string, string>();

    for (const period of periodIds) {
        const canonicalId = canonicalizePeriodId(period);

        if (!periodsByCanonicalId.has(canonicalId)) {
            periodsByCanonicalId.set(canonicalId, period);
        }
    }

    return Array.from(periodsByCanonicalId.values()).sort(safeComparePeriodIds);
};

export const buildPeriodIndexLookup = (periods: string[]): ((period: string) => number | undefined) => {
    const periodIndexByCanonicalId = new Map(periods.map((period, index) => [
        canonicalizePeriodId(period),
        index,
    ]));

    return (period: string) => periodIndexByCanonicalId.get(canonicalizePeriodId(period));
};
