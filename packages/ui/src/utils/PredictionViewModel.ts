import { createFixedPeriodFromPeriodId } from '@dhis2/multi-calendar-dates';
import type { PredictionRead } from '../httpfunctions';
import type {
    PredictionOrgUnitSeries,
    PredictionPointVM,
    QuantileKey,
} from '../interfaces/Prediction';

const QUANTILES: Array<[QuantileKey, number]> = [
    ['quantile_low', 0.1],
    ['median', 0.5],
    ['quantile_high', 0.9],
];

export function computeQuantile(quantile: number, values?: number[]): number {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const index = quantile * (n - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    if (lowerIndex === upperIndex) {
        return Math.round(sorted[lowerIndex]);
    }
    return Math.round(
        sorted[lowerIndex]
        + (sorted[upperIndex] - sorted[lowerIndex])
        * (index - lowerIndex),
    );
}

export type OrgUnitsById = Map<string, { displayName: string }>;

export function buildPredictionSeries(
    prediction: PredictionRead,
    orgUnitsById: OrgUnitsById,
    targetId: string,
): PredictionOrgUnitSeries[] {
    const byOrgUnit = new Map<string, PredictionOrgUnitSeries>();

    for (const forecast of prediction.forecasts) {
        const existing = byOrgUnit.get(forecast.orgUnit);
        const base: PredictionOrgUnitSeries = existing ?? {
            targetId,
            orgUnitId: forecast.orgUnit,
            orgUnitName: orgUnitsById.get(forecast.orgUnit)?.displayName ?? forecast.orgUnit,
            points: [],
        };

        const point: PredictionPointVM = {
            period: forecast.period,
            periodLabel: createFixedPeriodFromPeriodId({
                periodId: forecast.period,
                calendar: 'gregory',
            }).displayName,
            quantiles: QUANTILES.reduce((acc, [key, q]) => {
                acc[key] = computeQuantile(q, forecast.values);
                return acc;
            }, {} as Record<QuantileKey, number>),
        };

        base.points.push(point);
        byOrgUnit.set(forecast.orgUnit, base);
    }

    return Array.from(byOrgUnit.values())
        .map(series => ({
            ...series,
            points: series.points.sort((a, b) => a.period.localeCompare(b.period)),
        }))
        .sort((a, b) => a.orgUnitName.localeCompare(b.orgUnitName));
}
