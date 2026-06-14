import type { PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import {
    ALERT_KEY,
    getPredictionSetupQuantileTargets,
} from '@/utils/predictionSetupImportMapping';
import {
    quantileMappingFields,
    type QuantileMappingField,
} from './quantileMappingFormSchema';

const isQuantileMappingField = (quantile: string): quantile is QuantileMappingField => (
    (quantileMappingFields as readonly string[]).includes(quantile)
);

export const getDefaultQuantileMappingFields = (
    predictionSetup: PredictionSetupReadWithPredictions,
): Record<QuantileMappingField, string> => {
    const defaults: Record<QuantileMappingField, string> = {
        quantile_low: '',
        quantile_high: '',
        median: '',
        quantile_mid_low: '',
        quantile_mid_high: '',
    };

    getPredictionSetupQuantileTargets(predictionSetup).forEach(({ quantile, dataElementId }) => {
        if (isQuantileMappingField(quantile)) {
            defaults[quantile] = dataElementId;
        }
    });

    return defaults;
};

export const getDefaultOutbreakIndicator = (
    predictionSetup: PredictionSetupReadWithPredictions,
): string => {
    const targets = getPredictionSetupQuantileTargets(predictionSetup);
    return targets.find(t => t.quantile === ALERT_KEY)?.dataElementId ?? '';
};
