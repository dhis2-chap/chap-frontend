import { describe, expect, it } from 'vitest';
import { getPredictionSetupQuantileTargets } from './predictionSetupImportMapping';

const quantileTargets = [
    { quantile: 'quantile_high', dataElementId: 'high-id' },
    { quantile: 'median', dataElementId: 'median-id' },
];

describe('predictionSetupImportMapping', () => {
    it('returns the quantile targets from the prediction setup', () => {
        expect(getPredictionSetupQuantileTargets({
            quantileTargets,
        })).toEqual(quantileTargets);
    });

    it('normalizes object-shaped quantile targets', () => {
        expect(getPredictionSetupQuantileTargets({
            quantileTargets: {
                quantile_high: 'high-id',
                median: 'median-id',
            },
        })).toEqual([
            { quantile: 'quantile_high', dataElementId: 'high-id' },
            { quantile: 'median', dataElementId: 'median-id' },
        ]);
    });

    it('returns an empty array when nothing is provided', () => {
        expect(getPredictionSetupQuantileTargets()).toEqual([]);
        expect(getPredictionSetupQuantileTargets(null)).toEqual([]);
        expect(getPredictionSetupQuantileTargets({})).toEqual([]);
    });
});
