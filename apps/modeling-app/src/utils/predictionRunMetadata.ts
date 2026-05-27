import type { PredictionInfo } from '@dhis2-chap/ui';
import { formatPeriodId, getNextPeriods } from './periods';

const PREDICTION_PERIOD_METADATA_KEYS = [
    'predictionPeriods',
    'predictedPeriods',
];

const getStringArray = (value: unknown): string[] | undefined => (
    Array.isArray(value) && value.every(item => typeof item === 'string')
        ? value
        : undefined
);

const getStringValue = (value: unknown): string | undefined => (
    typeof value === 'string' && value.length > 0 ? value : undefined
);

const getMetadataPredictionPeriods = (metaData?: Record<string, unknown>) => {
    if (!metaData) {
        return undefined;
    }

    for (const key of PREDICTION_PERIOD_METADATA_KEYS) {
        const periods = getStringArray(metaData[key]);
        if (periods?.length) {
            return periods;
        }
    }

    return undefined;
};

const getMetadataTrainingDataToDate = (metaData?: Record<string, unknown>) => {
    if (!metaData) {
        return undefined;
    }

    const trainingData = metaData.trainingData;
    const isTrainingDataObject = !!trainingData && typeof trainingData === 'object' && !Array.isArray(trainingData);
    const nestedTrainingToDate = isTrainingDataObject
        ? getStringValue((trainingData as Record<string, unknown>).toDate)
        : undefined;

    return nestedTrainingToDate
        || getStringValue(metaData.trainingDataToDate)
        || getStringValue(metaData.toDate);
};

export { formatPeriodId, getNextPeriods };

export const getPredictionPeriodIds = (prediction: PredictionInfo) => (
    getMetadataPredictionPeriods(prediction.metaData)
    || getNextPeriods(
        prediction.dataset?.lastPeriod,
        prediction.dataset?.periodType,
        prediction.nPeriods,
    )
);

export const getTrainingDataToDate = (prediction: PredictionInfo) => (
    getMetadataTrainingDataToDate(prediction.metaData)
    || prediction.dataset?.lastPeriod
);

export const buildPredictionRunMetaData = ({
    nPeriods,
    periodType,
    trainingPeriods,
}: {
    nPeriods: number;
    periodType: string;
    trainingPeriods: string[];
}) => {
    const trainingDataToDate = trainingPeriods[trainingPeriods.length - 1];

    return {
        trainingData: {
            fromDate: trainingPeriods[0],
            toDate: trainingDataToDate,
            periods: trainingPeriods,
        },
        trainingDataToDate,
        predictionPeriods: getNextPeriods(trainingDataToDate, periodType, nPeriods),
    };
};
