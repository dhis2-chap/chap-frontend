import type { QuantileTarget } from '@dhis2-chap/ui';

export const QUANTILE_KEYS = [
    'quantile_high',
    'quantile_mid_high',
    'median',
    'quantile_mid_low',
    'quantile_low',
] as const;

export type QuantileKey = typeof QUANTILE_KEYS[number];

export const QUANTILE_SUGGESTED_KEYWORDS: Record<QuantileKey, string> = {
    quantile_high: 'high',
    quantile_mid_high: 'mid high',
    median: 'median',
    quantile_mid_low: 'mid low',
    quantile_low: 'low',
};

export type PredictionSetupFormValues = {
    name: string;
    use_import_mapping: boolean;
} & Record<QuantileKey, string>;

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

export const buildQuantileTargetsFromForm = (
    values: Pick<PredictionSetupFormValues, 'use_import_mapping' | QuantileKey>,
): QuantileTarget[] => {
    if (!values.use_import_mapping) {
        return [];
    }

    return QUANTILE_KEYS.map(quantile => ({
        quantile,
        dataElementId: values[quantile],
    }));
};

export const formValuesFromQuantileTargets = (
    name: string,
    quantileTargets: QuantileTarget[],
): PredictionSetupFormValues => {
    const getDataElementId = (quantileKey: QuantileKey) => (
        quantileTargets.find(target => target.quantile === quantileKey)?.dataElementId ?? ''
    );

    return {
        name,
        use_import_mapping: quantileTargets.length > 0,
        quantile_high: getDataElementId('quantile_high'),
        quantile_mid_high: getDataElementId('quantile_mid_high'),
        median: getDataElementId('median'),
        quantile_mid_low: getDataElementId('quantile_mid_low'),
        quantile_low: getDataElementId('quantile_low'),
    };
};
