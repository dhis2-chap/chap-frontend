import type { PredictionOrgUnitSeries } from '../interfaces/Prediction';
import {
    buildOutbreakIndicatorsForSeries,
    calculateMockEndemicThreshold,
    type OutbreakIndicator,
    type OutbreakProbability,
} from './outbreakAlerts';

export type ThresholdTileStatus = 'outbreak' | 'noOutbreak' | 'unavailable';

export type ThresholdTileViewModel = {
    endemicThreshold: number | null;
    indicators: OutbreakIndicator[];
    orgUnitId: string;
    orgUnitName: string;
    series: PredictionOrgUnitSeries;
    status: ThresholdTileStatus;
};

export type ThresholdSummary = {
    alertPeriods: number;
    regionsWithAlerts: number;
    totalRegions: number;
    unavailableThresholds: number;
};

export const getThresholdTileViewModels = (
    series: PredictionOrgUnitSeries[],
    selectedProbability: OutbreakProbability,
): {
    summary: ThresholdSummary;
    tiles: ThresholdTileViewModel[];
} => {
    const tiles = series.map((orgUnitSeries) => {
        const threshold = calculateMockEndemicThreshold(orgUnitSeries.actualCases);
        const indicators = buildOutbreakIndicatorsForSeries(orgUnitSeries, selectedProbability);
        const hasOutbreak = indicators.some(indicator => indicator.outbreak);
        const status: ThresholdTileStatus = !threshold.available
            ? 'unavailable'
            : hasOutbreak
                ? 'outbreak'
                : 'noOutbreak';

        return {
            endemicThreshold: threshold.threshold,
            indicators,
            orgUnitId: orgUnitSeries.orgUnitId,
            orgUnitName: orgUnitSeries.orgUnitName,
            series: orgUnitSeries,
            status,
        };
    });

    return {
        summary: {
            alertPeriods: tiles.reduce((count, tile) => (
                count + tile.indicators.filter(indicator => indicator.outbreak).length
            ), 0),
            regionsWithAlerts: tiles.filter(tile => tile.status === 'outbreak').length,
            totalRegions: tiles.length,
            unavailableThresholds: tiles.filter(tile => tile.status === 'unavailable').length,
        },
        tiles,
    };
};
