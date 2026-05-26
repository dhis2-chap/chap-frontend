import type { QuantileTarget } from '@dhis2-chap/ui';

const isRecord = (value: unknown): value is Record<string, unknown> => (
    !!value && typeof value === 'object' && !Array.isArray(value)
);

const isQuantileTarget = (value: unknown): value is QuantileTarget => (
    isRecord(value) &&
    typeof value.quantile === 'string' &&
    typeof value.dataElementId === 'string'
);

const normalizeQuantileTargets = (value: unknown): QuantileTarget[] => {
    if (Array.isArray(value)) {
        return value.filter(isQuantileTarget);
    }

    if (isRecord(value)) {
        return Object.entries(value)
            .filter(([, dataElementId]) => typeof dataElementId === 'string')
            .map(([quantile, dataElementId]) => ({
                quantile,
                dataElementId: dataElementId as string,
            }));
    }

    return [];
};

type PredictionSetupWithQuantileTargets = {
    quantileTargets?: unknown;
};

export const getPredictionSetupQuantileTargets = (
    predictionSetup?: PredictionSetupWithQuantileTargets | null,
) => {
    if (!predictionSetup) {
        return [];
    }

    return normalizeQuantileTargets(predictionSetup.quantileTargets);
};
