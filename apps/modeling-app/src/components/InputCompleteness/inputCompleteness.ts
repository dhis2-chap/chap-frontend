import { canonicalizePeriodId, type Dhis2Calendar, getPeriodsInRange } from '@dhis2-chap/core';
import type { ObservationBase } from '@dhis2-chap/ui';

// Saved Chap periods can use extended ISO notation and zero-padded weeks.
const normalizeInputPeriod = (period: string) => canonicalizePeriodId(period.replace(/-/g, ''));

export const getInputPeriods = (start: string | null | undefined, end: string | null | undefined, calendar: Dhis2Calendar): string[] => {
    if (!start || !end) return [];
    try {
        return getPeriodsInRange({
            startPeriodId: normalizeInputPeriod(start),
            endPeriodId: normalizeInputPeriod(end),
            calendar,
        }).map(period => period.id);
    } catch {
        return [];
    }
};

export const observationKey = (period: string, orgUnit: string, variable: string) => (
    JSON.stringify([normalizeInputPeriod(period), orgUnit, variable])
);

/** The target first, then every other column. */
export const getInputVariables = (targetColumn: string, columns: string[] = []) => (
    [...new Set([targetColumn, ...columns])]
);

/** Finite values (including zero) by period, location and variable. */
export const indexObservations = (observations: ObservationBase[]) => new Map(observations
    .filter(observation => observation.featureName && Number.isFinite(observation.value))
    .map(observation => [
        observationKey(observation.period, observation.orgUnit, observation.featureName!),
        observation.value as number,
    ]));

export const calculateInputCompleteness = (
    values: Map<string, number>,
    periods: string[],
    locations: string[],
    variables: string[],
) => {
    const expected = locations.length * variables.length;

    return periods.map((period) => {
        const missing = locations.flatMap((orgUnit) => {
            const missingVariables = variables.filter(variable => !values.has(observationKey(period, orgUnit, variable)));
            return missingVariables.length ? [{ orgUnit, variables: missingVariables }] : [];
        });
        const available = expected - missing.reduce((sum, location) => sum + location.variables.length, 0);
        const zeros = locations.reduce((sum, orgUnit) => (
            sum + variables.filter(variable => values.get(observationKey(period, orgUnit, variable)) === 0).length
        ), 0);
        const locationsByVariable = variables.map(variable => (
            locations.filter(orgUnit => values.has(observationKey(period, orgUnit, variable))).length
        ));
        return {
            period,
            expected,
            available,
            zeros,
            completeness: expected ? available / expected : null,
            locationsByVariable,
            missing,
        };
    });
};
