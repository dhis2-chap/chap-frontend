import { canonicalizePeriodId } from '@dhis2-chap/core';
import type { ThresholdEntry } from '../httpfunctions';
import type {
    PredictionOrgUnitSeries,
    PredictionPointVM,
    QuantileKey,
} from '../interfaces/Prediction';

export const OUTBREAK_PROBABILITY_OPTIONS = [10, 25, 50, 75, 90] as const;
export const DEFAULT_OUTBREAK_PROBABILITY = 75;

export type OutbreakProbability = typeof OUTBREAK_PROBABILITY_OPTIONS[number];
export type SupportedOutbreakProbabilityBucket = OutbreakProbability | '<10';

export type EndemicThresholdPoint = {
    period: string;
    value: number | null;
    lowerValue?: number | null;
};

export type ThresholdLineRoles = {
    upperIndex: number;
    lowerIndex?: number;
};

export const isFiniteNumber = (value: unknown): value is number => (
    typeof value === 'number' && Number.isFinite(value)
);

// Alert logic keys on the upper line; periods are matched by canonical id so
// differently spelled week ids (2025W3 vs 2025W03) still line up.
const buildThresholdValueByPeriod = (
    thresholds: EndemicThresholdPoint[] = [],
): Map<string, number | null> => new Map(
    thresholds.map(threshold => [canonicalizePeriodId(threshold.period), threshold.value]),
);

// Historical chart thresholds do not establish whether forecast alerts can be
// calculated. Count forecast coverage explicitly, including omitted API rows.
export const getForecastThresholdCoverage = (
    series: PredictionOrgUnitSeries,
    thresholds?: EndemicThresholdPoint[],
): { available: number; missing: number } => {
    const thresholdByPeriod = buildThresholdValueByPeriod(thresholds);
    const forecastPeriods = new Set(series.points.map(point => canonicalizePeriodId(point.period)));
    let available = 0;
    for (const period of forecastPeriods) {
        if (isFiniteNumber(thresholdByPeriod.get(period))) {
            available++;
        }
    }
    return { available, missing: forecastPeriods.size - available };
};

export const buildEndemicThresholdMap = (
    entries: ThresholdEntry[],
    { upperIndex, lowerIndex }: ThresholdLineRoles,
): Map<string, EndemicThresholdPoint[]> => {
    const map = new Map<string, EndemicThresholdPoint[]>();

    for (const entry of entries) {
        const existing = map.get(entry.location) ?? [];
        existing.push({
            period: entry.period,
            value: entry.values[upperIndex] ?? null,
            ...(lowerIndex !== undefined && {
                lowerValue: entry.values[lowerIndex] ?? null,
            }),
        });
        map.set(entry.location, existing);
    }

    return map;
};

export type OutbreakIndicator = {
    orgUnitId: string;
    orgUnitName: string;
    period: string;
    threshold: number;
    supportedProbability: SupportedOutbreakProbabilityBucket;
    outbreak: boolean;
    value: '1' | '0';
};

const PROBABILITY_TO_QUANTILE_KEY: Record<OutbreakProbability, QuantileKey> = {
    10: 'quantile_high',
    25: 'quantile_mid_high',
    50: 'median',
    75: 'quantile_mid_low',
    90: 'quantile_low',
};

const PROBABILITIES_DESCENDING: OutbreakProbability[] = [90, 75, 50, 25, 10];

export const getQuantileKeyForOutbreakProbability = (
    probability: OutbreakProbability,
): QuantileKey => PROBABILITY_TO_QUANTILE_KEY[probability];

export const parseOutbreakProbability = (
    value: string | null | undefined,
): OutbreakProbability => {
    const numericValue = Number(value);

    return OUTBREAK_PROBABILITY_OPTIONS.includes(numericValue as OutbreakProbability)
        ? numericValue as OutbreakProbability
        : DEFAULT_OUTBREAK_PROBABILITY;
};

export const getSupportedOutbreakProbabilityBucket = (
    point: PredictionPointVM,
    threshold: number,
): SupportedOutbreakProbabilityBucket => {
    const supportedProbability = PROBABILITIES_DESCENDING.find((probability) => {
        const quantileKey = getQuantileKeyForOutbreakProbability(probability);
        const quantileValue = point.quantiles[quantileKey];

        return isFiniteNumber(quantileValue) && quantileValue >= threshold;
    });

    return supportedProbability ?? '<10';
};

export const isOutbreakAtProbability = (
    point: PredictionPointVM,
    threshold: number,
    selectedProbability: OutbreakProbability,
): boolean => {
    const quantileKey = getQuantileKeyForOutbreakProbability(selectedProbability);
    const quantileValue = point.quantiles[quantileKey];

    return isFiniteNumber(quantileValue) && quantileValue >= threshold;
};

export const buildOutbreakIndicatorsForSeries = (
    series: PredictionOrgUnitSeries,
    selectedProbability: OutbreakProbability,
    thresholds?: EndemicThresholdPoint[],
): OutbreakIndicator[] => {
    if (!thresholds) {
        return [];
    }

    const thresholdByPeriod = buildThresholdValueByPeriod(thresholds);

    return series.points.flatMap((point) => {
        const threshold = thresholdByPeriod.get(canonicalizePeriodId(point.period));
        if (!isFiniteNumber(threshold)) {
            return [];
        }

        const outbreak = isOutbreakAtProbability(point, threshold, selectedProbability);

        return [{
            orgUnitId: series.orgUnitId,
            orgUnitName: series.orgUnitName,
            period: point.period,
            threshold,
            supportedProbability: getSupportedOutbreakProbabilityBucket(point, threshold),
            outbreak,
            value: outbreak ? '1' : '0',
        }];
    });
};

export const buildOutbreakIndicators = (
    series: PredictionOrgUnitSeries[],
    selectedProbability: OutbreakProbability,
    thresholdMap?: Map<string, EndemicThresholdPoint[]>,
): OutbreakIndicator[] => series.flatMap(orgUnitSeries => (
    buildOutbreakIndicatorsForSeries(
        orgUnitSeries,
        selectedProbability,
        thresholdMap?.get(orgUnitSeries.orgUnitId),
    )
));

export const getHighestSupportedOutbreakProbability = (
    indicators: OutbreakIndicator[],
): SupportedOutbreakProbabilityBucket => {
    const numericBuckets = indicators
        .map(indicator => indicator.supportedProbability)
        .filter((bucket): bucket is OutbreakProbability => bucket !== '<10');

    if (numericBuckets.length === 0) {
        return '<10';
    }

    return Math.max(...numericBuckets) as OutbreakProbability;
};
