import { describe, expect, it } from 'vitest';
import {
    buildPredictionSetupMetaData,
    getPredictionSetupDataImportMappings,
} from './predictionSetupImportMapping';

const dataImportMappings = [
    { quantileKey: 'quantile_high', dataElementId: 'high-id' },
    { quantileKey: 'median', dataElementId: 'median-id' },
];

describe('predictionSetupImportMapping', () => {
    it('builds metadata for default import mappings', () => {
        expect(buildPredictionSetupMetaData(dataImportMappings)).toEqual({
            dataImportMappings,
        });
    });

    it('omits metadata when no default import mappings are provided', () => {
        expect(buildPredictionSetupMetaData([])).toBeUndefined();
    });

    it('reads default import mappings from prediction setup metadata', () => {
        expect(getPredictionSetupDataImportMappings({
            metaData: {
                dataImportMappings,
            },
        })).toEqual(dataImportMappings);
    });

    it('falls back to top-level import mappings', () => {
        expect(getPredictionSetupDataImportMappings({
            dataImportMappings,
        })).toEqual(dataImportMappings);
    });

    it('normalizes object-shaped metadata mappings', () => {
        expect(getPredictionSetupDataImportMappings({
            metaData: {
                dataImportMappings: {
                    quantile_high: 'high-id',
                    median: 'median-id',
                },
            },
        })).toEqual([
            { quantileKey: 'quantile_high', dataElementId: 'high-id' },
            { quantileKey: 'median', dataElementId: 'median-id' },
        ]);
    });
});
