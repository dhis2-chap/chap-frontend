import { createFixedPeriodFromPeriodId } from '@dhis2/multi-calendar-dates';
import type { PredictionEntry } from '../httpfunctions';
import type {
    PredictionOrgUnitSeries,
    PredictionPointVM,
    QuantileKey,
} from '../interfaces/Prediction';

// Map quantile values to their keys
const QUANTILE_MAP: Record<number, QuantileKey> = {
    0.1: 'quantile_low',
    0.5: 'median',
    0.9: 'quantile_high',
};

export type OrgUnitsById = Map<string, { displayName: string }>;

const createPredictionPoint = (period: string): PredictionPointVM => ({
    period,
    periodLabel: createFixedPeriodFromPeriodId({
        periodId: period,
        calendar: 'gregory',
    }).displayName,
    quantiles: {} as Record<QuantileKey, number>,
});

export function buildPredictionSeries(
    predictionEntries: PredictionEntry[],
    orgUnitsById: OrgUnitsById,
    targetId: string,
): PredictionOrgUnitSeries[] {
    const byOrgUnit = predictionEntries.reduce((acc, entry) => {
        const quantileKey = QUANTILE_MAP[entry.quantile];
        if (!quantileKey) return acc;

        const orgUnitData = acc.get(entry.orgUnit) ?? acc.set(entry.orgUnit, new Map()).get(entry.orgUnit)!;
        const point = orgUnitData.get(entry.period) ?? orgUnitData.set(entry.period, createPredictionPoint(entry.period)).get(entry.period)!;

        point.quantiles[quantileKey] = entry.value;
        return acc;
    }, new Map<string, Map<string, PredictionPointVM>>());

    return Array.from(byOrgUnit.entries())
        .map(([orgUnitId, periodsMap]) => ({
            targetId,
            orgUnitId,
            orgUnitName: orgUnitsById.get(orgUnitId)?.displayName ?? orgUnitId,
            points: Array.from(periodsMap.values()).sort((a, b) =>
                a.period.localeCompare(b.period),
            ),
        }));
}
