import { DEFAULT_DHIS2_CALENDAR, getPeriodsInRange } from '@dhis2-chap/core';
import type { ObservationBase } from '@dhis2-chap/ui';
import { parseSupportedPeriodType } from '../../utils/supportedPeriodType';

// Saved CHAP periods can use either basic or extended ISO notation.
export const normalizeInputPeriod = (period: string) => period
    .replace(/-/g, '')
    .replace(/W(\d)$/, 'W0$1');

export const getInputPeriods = (start: string, end: string, periodType?: string | null): string[] => {
    if (!start || !end) return [];
    const type = parseSupportedPeriodType(periodType);
    const pattern = type === 'MONTH' ? /^\d{6}$/ : type === 'WEEK' ? /^\d{4}W\d{2}$/ : undefined;
    if (pattern && (!pattern.test(normalizeInputPeriod(start)) || !pattern.test(normalizeInputPeriod(end)))) return [];
    try {
        return getPeriodsInRange({
            startPeriodId: normalizeInputPeriod(start),
            endPeriodId: normalizeInputPeriod(end),
            calendar: DEFAULT_DHIS2_CALENDAR,
        }).map(period => normalizeInputPeriod(period.id));
    } catch {
        return [];
    }
};

export const observationKey = (period: string, orgUnit: string, variable: string) => (
    JSON.stringify([normalizeInputPeriod(period), orgUnit, variable])
);

/** Finite values (including zero) by period, location and variable. */
export const indexObservations = (observations: ObservationBase[]) => new Map(observations
    .filter(observation => observation.featureName && Number.isFinite(observation.value))
    .map(observation => [
        observationKey(observation.period, observation.orgUnit, observation.featureName!),
        observation.value as number,
    ]));

export const calculateInputCompleteness = (
    observations: ObservationBase[],
    periods: string[],
    orgUnits: string[],
    variables: string[],
) => {
    const locations = [...new Set(orgUnits)];
    const features = [...new Set(variables)];
    const expected = locations.length * features.length;
    const values = indexObservations(observations);

    return periods.map((period) => {
        const missing = locations.flatMap((orgUnit) => {
            const missingVariables = features.filter(variable => !values.has(observationKey(period, orgUnit, variable)));
            return missingVariables.length ? [{ orgUnit, variables: missingVariables }] : [];
        });
        const available = expected - missing.reduce((sum, location) => sum + location.variables.length, 0);
        const zeros = locations.reduce((sum, orgUnit) => (
            sum + features.filter(variable => values.get(observationKey(period, orgUnit, variable)) === 0).length
        ), 0);
        return { period, expected, available, zeros, completeness: expected ? available / expected : null, missing };
    });
};
