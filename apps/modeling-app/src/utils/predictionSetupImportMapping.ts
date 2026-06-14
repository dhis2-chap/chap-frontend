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

export const ALERT_KEY = 'outbreak_indicator' as const;
export type AlertKey = typeof ALERT_KEY;

export const ALL_MAPPING_KEYS = [...QUANTILE_KEYS, ALERT_KEY] as const;
export type MappingKey = typeof ALL_MAPPING_KEYS[number];

export type PredictionSetupFormValues = {
    name: string;
    use_import_mapping: boolean;
} & Record<QuantileKey, string> & Record<AlertKey, string>;

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
    values: Pick<PredictionSetupFormValues, 'use_import_mapping' | QuantileKey | AlertKey>,
): QuantileTarget[] => {
    if (!values.use_import_mapping) {
        return [];
    }

    return ALL_MAPPING_KEYS
        .filter(key => !!values[key])
        .map(key => ({
            quantile: key,
            dataElementId: values[key],
        }));
};

export const formValuesFromQuantileTargets = (
    name: string,
    quantileTargets: QuantileTarget[],
): PredictionSetupFormValues => {
    const getDataElementId = (key: MappingKey) => (
        quantileTargets.find(target => target.quantile === key)?.dataElementId ?? ''
    );

    return {
        name,
        use_import_mapping: quantileTargets.length > 0,
        quantile_high: getDataElementId('quantile_high'),
        quantile_mid_high: getDataElementId('quantile_mid_high'),
        median: getDataElementId('median'),
        quantile_mid_low: getDataElementId('quantile_mid_low'),
        quantile_low: getDataElementId('quantile_low'),
        outbreak_indicator: getDataElementId('outbreak_indicator'),
    };
};
