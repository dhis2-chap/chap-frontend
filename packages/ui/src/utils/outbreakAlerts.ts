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

const isFiniteNumber = (value: unknown): value is number => (
    typeof value === 'number' && Number.isFinite(value)
);

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

    const thresholdByPeriod = new Map(
        thresholds.map(t => [t.period, t.value]),
    );

    return series.points
        .filter((point) => {
            const value = thresholdByPeriod.get(point.period);
            return value !== undefined && value !== null;
        })
        .map((point) => {
            const threshold = thresholdByPeriod.get(point.period) as number;
            return {
                orgUnitId: series.orgUnitId,
                orgUnitName: series.orgUnitName,
                period: point.period,
                threshold,
                supportedProbability: getSupportedOutbreakProbabilityBucket(
                    point,
                    threshold,
                ),
                outbreak: isOutbreakAtProbability(
                    point,
                    threshold,
                    selectedProbability,
                ),
                value: isOutbreakAtProbability(
                    point,
                    threshold,
                    selectedProbability,
                ) ? '1' : '0',
            };
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
