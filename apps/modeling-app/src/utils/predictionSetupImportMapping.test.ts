import { describe, expect, it } from 'vitest';
import {
    buildQuantileTargetsFromForm,
    formValuesFromQuantileTargets,
    getPredictionSetupQuantileTargets,
} from './predictionSetupImportMapping';

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

    it('builds quantile targets from form values', () => {
        expect(buildQuantileTargetsFromForm({
            use_import_mapping: true,
            quantile_high: 'high-id',
            quantile_mid_high: 'mid-high-id',
            median: 'median-id',
            quantile_mid_low: 'mid-low-id',
            quantile_low: 'low-id',
        })).toEqual([
            { quantile: 'quantile_high', dataElementId: 'high-id' },
            { quantile: 'quantile_mid_high', dataElementId: 'mid-high-id' },
            { quantile: 'median', dataElementId: 'median-id' },
            { quantile: 'quantile_mid_low', dataElementId: 'mid-low-id' },
            { quantile: 'quantile_low', dataElementId: 'low-id' },
        ]);
    });

    it('returns no quantile targets when import mapping is disabled', () => {
        expect(buildQuantileTargetsFromForm({
            use_import_mapping: false,
            quantile_high: '',
            quantile_mid_high: '',
            median: '',
            quantile_mid_low: '',
            quantile_low: '',
        })).toEqual([]);
    });

    it('builds form values from quantile targets', () => {
        expect(formValuesFromQuantileTargets('Setup A', quantileTargets)).toEqual({
            name: 'Setup A',
            use_import_mapping: true,
            quantile_high: 'high-id',
            quantile_mid_high: '',
            median: 'median-id',
            quantile_mid_low: '',
            quantile_low: '',
        });
    });
});
