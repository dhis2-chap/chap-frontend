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

export function buildPredictionSeries(
    predictionEntries: PredictionEntry[],
    orgUnitsById: OrgUnitsById,
    targetId: string,
): PredictionOrgUnitSeries[] {
    // Group by orgUnit, then by period
    const byOrgUnit = new Map<string, Map<string, PredictionPointVM>>();

    for (const entry of predictionEntries) {
        const quantileKey = QUANTILE_MAP[entry.quantile];
        if (!quantileKey) continue; // Skip unknown quantiles

        let orgUnitData = byOrgUnit.get(entry.orgUnit);
        if (!orgUnitData) {
            orgUnitData = new Map();
            byOrgUnit.set(entry.orgUnit, orgUnitData);
        }

        let point = orgUnitData.get(entry.period);
        if (!point) {
            point = {
                period: entry.period,
                periodLabel: createFixedPeriodFromPeriodId({
                    periodId: entry.period,
                    calendar: 'gregory',
                }).displayName,
                quantiles: {} as Record<QuantileKey, number>,
            };
            orgUnitData.set(entry.period, point);
        }

        point.quantiles[quantileKey] = entry.value;
    }

    // Convert to the final structure
    return Array.from(byOrgUnit.entries())
        .map(([orgUnitId, periodsMap]) => ({
            targetId,
            orgUnitId,
            orgUnitName: orgUnitsById.get(orgUnitId)?.displayName ?? orgUnitId,
            points: Array.from(periodsMap.values()).sort((a, b) =>
                a.period.localeCompare(b.period),
            ),
        }))
        .sort((a, b) => a.orgUnitName.localeCompare(b.orgUnitName));
}
