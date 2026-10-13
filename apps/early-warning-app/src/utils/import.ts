import { toDhis2ForecastPeriod, FORECAST_QUANTILE_KEYS, mapForecastDataValues } from '@dhis2-chap/core';
import type { AlertRead, PredictionEntry, QuantileTarget } from '@dhis2-chap/ui';

export const hasImportMapping = (targets: QuantileTarget[]) => targets.some(target =>
    target.dataElementId && (Object.values(FORECAST_QUANTILE_KEYS).includes(target.quantile) || Object.keys(FORECAST_QUANTILE_KEYS).includes(target.quantile)));

export const alertCell = (orgUnit: string, period: string) => `${orgUnit}|${toDhis2ForecastPeriod(period)}`;

/** Only selected forecasts and accepted indicators are released to DHIS2. */
export const buildReviewDataValues = (
    entries: PredictionEntry[],
    targets: QuantileTarget[],
    selected: Set<string>,
    accepted: AlertRead[],
) => {
    const selectedEntries = entries.filter(entry => selected.has(entry.orgUnit));
    const values = mapForecastDataValues(selectedEntries, targets);
    const indicator = targets.find(target => target.quantile === 'outbreak_indicator')?.dataElementId;
    const cells = new Map(selectedEntries.map(entry => [alertCell(entry.orgUnit, entry.period), entry]));
    const seen = new Set<string>();
    if (indicator) {
        for (const alert of accepted) {
            const cell = alertCell(alert.orgUnit, alert.timePeriod);
            const entry = cells.get(cell);
            if (!entry || seen.has(cell)) continue;
            seen.add(cell);
            values.push({ dataElement: indicator, period: toDhis2ForecastPeriod(entry.period), orgUnit: entry.orgUnit, value: '1' });
        }
    }
    return values;
};
