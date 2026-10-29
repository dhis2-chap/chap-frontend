import { describe, expect, it } from 'vitest';
import type { ConfiguredModelInfoRead, ModelTemplateRead } from '@dhis2-chap/ui';
import { getForecastHorizonError } from './forecastHorizon';

const model = (limits: Partial<ModelTemplateRead>): ConfiguredModelInfoRead => ({
    id: 1,
    name: 'configured_model',
    displayName: 'Configured model',
    modelTemplateId: 2,
    modelTemplate: { id: 2, name: 'template', minPredictionLength: null, maxPredictionLength: null, ...limits },
});

describe('forecast horizon validation', () => {
    it('accepts inclusive bounds and identifies the model and range on either side', () => {
        const configured = model({ minPredictionPeriods: 2, maxPredictionPeriods: 4 });
        for (const periods of [2, 3, 4]) expect(getForecastHorizonError(configured, periods)).toBeUndefined();
        for (const periods of [1, 5]) {
            expect(getForecastHorizonError(configured, periods)).toBe(
                'Configured model supports 2–4 forecast periods.',
            );
        }
    });

    it('allows absent limits and validates one-sided limits independently', () => {
        expect(getForecastHorizonError(model({}), 100)).toBeUndefined();
        expect(getForecastHorizonError(model({ minPredictionPeriods: 4 }), 3)).toContain('at least 4');
        expect(getForecastHorizonError(model({ minPredictionPeriods: 4 }), 100)).toBeUndefined();
        expect(getForecastHorizonError(model({ maxPredictionPeriods: 4 }), 5)).toContain('at most 4');
        expect(getForecastHorizonError(model({ maxPredictionPeriods: 4 }), 1)).toBeUndefined();
    });
});
