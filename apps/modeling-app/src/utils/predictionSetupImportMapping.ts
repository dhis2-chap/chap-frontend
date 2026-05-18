import type { DataImportMapping } from '@dhis2-chap/ui';

const DEFAULT_IMPORT_MAPPING_METADATA_KEY = 'dataImportMappings';

type PredictionSetupWithImportMapping = {
    dataImportMappings?: unknown;
    metaData?: unknown;
    metadata?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
    !!value && typeof value === 'object' && !Array.isArray(value)
);

const isDataImportMapping = (value: unknown): value is DataImportMapping => (
    isRecord(value) &&
    typeof value.quantileKey === 'string' &&
    typeof value.dataElementId === 'string'
);

const normalizeDataImportMappings = (value: unknown): DataImportMapping[] => {
    if (Array.isArray(value)) {
        return value.filter(isDataImportMapping);
    }

    if (isRecord(value)) {
        return Object.entries(value)
            .filter(([, dataElementId]) => typeof dataElementId === 'string')
            .map(([quantileKey, dataElementId]) => ({
                quantileKey,
                dataElementId: dataElementId as string,
            }));
    }

    return [];
};

const getMetaData = (predictionSetup: PredictionSetupWithImportMapping) => {
    if (isRecord(predictionSetup.metaData)) {
        return predictionSetup.metaData;
    }

    if (isRecord(predictionSetup.metadata)) {
        return predictionSetup.metadata;
    }

    return undefined;
};

export const getPredictionSetupDataImportMappings = (
    predictionSetup?: PredictionSetupWithImportMapping | null,
) => {
    if (!predictionSetup) {
        return [];
    }

    const metaData = getMetaData(predictionSetup);
    const metadataMappings = normalizeDataImportMappings(
        metaData?.[DEFAULT_IMPORT_MAPPING_METADATA_KEY],
    );

    if (metadataMappings.length) {
        return metadataMappings;
    }

    return normalizeDataImportMappings(predictionSetup.dataImportMappings);
};
