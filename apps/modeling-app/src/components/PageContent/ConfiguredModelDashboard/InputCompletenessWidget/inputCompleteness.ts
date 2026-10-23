import { DEFAULT_DHIS2_CALENDAR, getPeriodsInRange } from '@dhis2-chap/core';
import type { ConfiguredModelRead, ObservationBase } from '@dhis2-chap/ui';
import { parseSupportedPeriodType } from '../../../../utils/supportedPeriodType';

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

export const getExpectedVariables = (model: ConfiguredModelRead) => [...new Set([
    model.modelTemplate.target ?? 'disease_cases',
    ...(model.modelTemplate.requiredCovariates ?? []),
    ...(model.additionalContinuousCovariates ?? []),
].filter((variable): variable is string => !!variable))];

const observationKey = (period: string, orgUnit: string, variable: string) => (
    JSON.stringify([normalizeInputPeriod(period), orgUnit, variable])
);

export const calculateInputCompleteness = (
    observations: ObservationBase[],
    periods: string[],
    orgUnits: string[],
    variables: string[],
) => {
    const locations = [...new Set(orgUnits)];
    const features = [...new Set(variables)];
    const expected = locations.length * features.length;
    const availableKeys = new Set(observations
        .filter(observation => observation.featureName && Number.isFinite(observation.value))
        .map(observation => observationKey(observation.period, observation.orgUnit, observation.featureName!)));

    return periods.map((period) => {
        const missing = locations.flatMap((orgUnit) => {
            const missingVariables = features.filter(variable => !availableKeys.has(observationKey(period, orgUnit, variable)));
            return missingVariables.length ? [{ orgUnit, variables: missingVariables }] : [];
        });
        const available = expected - missing.reduce((sum, location) => sum + location.variables.length, 0);
        return { period, expected, available, completeness: expected ? available / expected : null, missing };
    });
};
