import { describe, expect, it } from 'vitest';
import { getPredictionSetupDataImportMappings } from './predictionSetupImportMapping';

const dataImportMappings = [
    { quantileKey: 'quantile_high', dataElementId: 'high-id' },
    { quantileKey: 'median', dataElementId: 'median-id' },
];

describe('predictionSetupImportMapping', () => {
    it('reads legacy default import mappings from prediction setup metadata', () => {
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
