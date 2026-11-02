import { canonicalizePeriodId } from '@dhis2-chap/core';
import type { AlertLevel, AlertPolicyRead, PredictionEntry, PredictionOrgUnitSeries, ThresholdResponse } from '@dhis2-chap/ui';

export type ImportOutbreakIndicator = { orgUnitId: string; period: string; value: string };

// Request the quantile matching each level's probability, including policies
// created outside this app with probabilities other than the five UI presets.
export const getAlertLevelQuantile = (level: AlertLevel) => Number((1 - level.exceedanceThreshold).toPrecision(15));
const cellKey = (orgUnit: string, period: string) => JSON.stringify([orgUnit, canonicalizePeriodId(period)]);

export const buildPolicyOutbreakIndicators = (
    series: PredictionOrgUnitSeries[],
    policy: AlertPolicyRead,
    entries: PredictionEntry[],
    thresholds: ThresholdResponse[],
): ImportOutbreakIndicator[] => {
    const levels = policy.levels ?? [];
    if (!levels.length) return [];
    const forecastByCell = new Map<string, Map<number, number>>();
    for (const entry of entries) {
        const key = cellKey(entry.orgUnit, entry.period);
        const quantiles = forecastByCell.get(key) ?? new Map<number, number>();
        quantiles.set(entry.quantile, entry.value);
        forecastByCell.set(key, quantiles);
    }
    const thresholdsByLevel = thresholds.map(response => new Map(response.entries.map(entry => [
        cellKey(entry.location, entry.period), entry.values[0],
    ])));
    return series.flatMap(region => region.points.flatMap((point) => {
        const key = cellKey(region.orgUnitId, point.period);
        let value = policy.noAlertOutputCode ?? '0';
        // Once a level fires, missing lower levels cannot change the highest severity.
        for (let index = levels.length - 1; index >= 0; index--) {
            const level = levels[index];
            const threshold = thresholdsByLevel[index]?.get(key);
            const forecast = forecastByCell.get(key)?.get(getAlertLevelQuantile(level));
            if (threshold == null || !Number.isFinite(threshold) || forecast == null || !Number.isFinite(forecast)) {
                return [];
            }
            if (forecast >= threshold) {
                value = level.outputCode;
                break;
            }
        }
        return [{ orgUnitId: region.orgUnitId, period: point.period, value }];
    }));
};
