import type { PredictionOrgUnitSeries } from '../interfaces/Prediction';
import {
    buildOutbreakIndicatorsForSeries,
    calculateMockEndemicThreshold,
    type OutbreakIndicator,
    type OutbreakProbability,
} from './outbreakAlerts';

const Y_AXIS_HEADROOM_MULTIPLIER = 1.05;

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

const getNumericMax = (values: Array<number | null | undefined>): number | undefined => {
    const numericValues = values.filter(
        (value): value is number =>
            value !== null &&
            value !== undefined &&
            Number.isFinite(value),
    );

    if (numericValues.length === 0) {
        return undefined;
    }

    return Math.max(...numericValues);
};

export const getStableMaxYForThresholdChart = (
    series: PredictionOrgUnitSeries,
    endemicThreshold: number | null,
): number | undefined => {
    const rawMax = getNumericMax([
        ...(series.actualCases?.map(actualCase => actualCase.value) ?? []),
        ...series.points.flatMap(point => [
            point.quantiles.quantile_low,
            point.quantiles.quantile_mid_low,
            point.quantiles.median,
            point.quantiles.quantile_mid_high,
            point.quantiles.quantile_high,
        ]),
        endemicThreshold,
    ]);

    if (rawMax === undefined) {
        return undefined;
    }

    return rawMax * Y_AXIS_HEADROOM_MULTIPLIER;
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
