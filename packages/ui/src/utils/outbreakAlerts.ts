import type {
    PredictionOrgUnitSeries,
    PredictionPointVM,
    QuantileKey,
} from '../interfaces/Prediction';

export const OUTBREAK_PROBABILITY_OPTIONS = [10, 25, 50, 75, 90] as const;
export const DEFAULT_OUTBREAK_PROBABILITY = 75;
export const MINIMUM_THRESHOLD_OBSERVATIONS = 4;

export type OutbreakProbability = typeof OUTBREAK_PROBABILITY_OPTIONS[number];
export type SupportedOutbreakProbabilityBucket = OutbreakProbability | '<10';

export type ActualCasePoint = {
    period: string;
    value: number | null;
};

export type MockEndemicThresholdResult = {
    available: boolean;
    threshold: number | null;
    observationCount: number;
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

export const calculateMockEndemicThreshold = (
    actualCases: ActualCasePoint[] | undefined,
    minimumObservations = MINIMUM_THRESHOLD_OBSERVATIONS,
): MockEndemicThresholdResult => {
    const values = (actualCases ?? [])
        .map(actualCase => actualCase.value)
        .filter(isFiniteNumber);

    if (values.length < minimumObservations) {
        return {
            available: false,
            threshold: null,
            observationCount: values.length,
        };
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => (
        sum + ((value - mean) ** 2)
    ), 0) / values.length;

    return {
        available: true,
        threshold: mean + (2 * Math.sqrt(variance)),
        observationCount: values.length,
    };
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
): OutbreakIndicator[] => {
    const thresholdResult = calculateMockEndemicThreshold(series.actualCases);

    if (!thresholdResult.available || thresholdResult.threshold === null) {
        return [];
    }

    const threshold = thresholdResult.threshold;

    return series.points.map(point => ({
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
    }));
};

export const buildOutbreakIndicators = (
    series: PredictionOrgUnitSeries[],
    selectedProbability: OutbreakProbability,
): OutbreakIndicator[] => series.flatMap(orgUnitSeries => (
    buildOutbreakIndicatorsForSeries(orgUnitSeries, selectedProbability)
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
