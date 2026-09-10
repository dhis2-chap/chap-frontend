import { describe, expect, it, vi } from 'vitest';
import { importLocationStateSchema } from './quantileMappingFormSchema';

// The schema only needs the probability options; the real barrel pulls in
// @dhis2/ui, which cannot load in the node test environment.
vi.mock('@dhis2-chap/ui', () => ({
    OUTBREAK_PROBABILITY_OPTIONS: [10, 25, 50, 75, 90],
}));

describe('importLocationStateSchema', () => {
    const validState = {
        alertProbability: 75,
        thresholdParams: {
            type: 'percentile',
            quantile: [0.25, 0.75],
            baselineYears: 5,
        },
        useAlertOutputs: true,
    };

    it('accepts a fully valid state', () => {
        expect(importLocationStateSchema.parse(validState)).toEqual(validState);
    });

    it('drops percentile params breaking the invariants but keeps the other fields', () => {
        const invalidQuantiles = [
            [0.75, 0.25],
            [0.5, 0.5],
            [25, 75],
            [-0.1, 0.75],
            [0.25, 1.5],
        ];

        for (const quantile of invalidQuantiles) {
            const state = importLocationStateSchema.parse({
                ...validState,
                thresholdParams: { type: 'percentile', quantile, baselineYears: 5 },
            });

            expect(state?.thresholdParams).toBeUndefined();
            expect(state?.alertProbability).toBe(75);
            expect(state?.useAlertOutputs).toBe(true);
        }
    });

    it('drops a seasonal params with a negative std multiplier', () => {
        const state = importLocationStateSchema.parse({
            ...validState,
            thresholdParams: { type: 'seasonal', stdMultiplier: -1 },
        });

        expect(state?.thresholdParams).toBeUndefined();
        expect(state?.alertProbability).toBe(75);
    });

    it('drops each invalid field on its own', () => {
        const state = importLocationStateSchema.parse({
            alertProbability: 33,
            thresholdParams: validState.thresholdParams,
            useAlertOutputs: 'yes',
        });

        expect(state?.alertProbability).toBeUndefined();
        expect(state?.useAlertOutputs).toBeUndefined();
        expect(state?.thresholdParams).toEqual(validState.thresholdParams);
    });
});
