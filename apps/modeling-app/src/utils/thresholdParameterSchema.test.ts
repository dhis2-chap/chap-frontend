import { describe, expect, it } from 'vitest';
import { readThresholdStrategies, thresholdParameterDefaults, thresholdParameterValidator } from './thresholdParameterSchema';
import { thresholdOpenApi } from './__fixtures__/thresholdOpenApi';

describe('alert threshold schema', () => {
    const strategies = readThresholdStrategies(thresholdOpenApi);
    it('reads strategies and defaults from the endpoint oneOf', () => {
        expect(strategies.map(strategy => strategy.id)).toEqual(['seasonal', 'percentile']);
        expect(thresholdParameterDefaults(strategies[0])).toEqual({ stdMultiplier: '2' });
        expect(thresholdParameterDefaults(strategies[1])).toEqual({ quantile: '0.75', baselineYears: '5' });
    });
    it('accepts one line and a nullable baseline without inventing defaults for blank input', () => {
        const validator = thresholdParameterValidator(strategies[1]);
        expect(validator.parse({ type: 'percentile', quantile: '0.75', baselineYears: '' })).toEqual({ type: 'percentile', quantile: 0.75, baselineYears: null });
    });
    it('rejects multi-line alert levels, invalid probabilities, and non-integer baselines', () => {
        const validator = thresholdParameterValidator(strategies[1]);
        for (const quantile of [[0.25, 0.75], '0.25, 0.75', '1.1', '-0.1', 'Infinity', 'abc', ' ']) {
            expect(validator.safeParse({ type: 'percentile', quantile, baselineYears: '5' }).success).toBe(false);
        }
        for (const baselineYears of ['0', '1.5', '-1']) {
            expect(validator.safeParse({ type: 'percentile', quantile: '0.75', baselineYears }).success).toBe(false);
        }
    });
    it('discovers a newly added strategy without a frontend strategy registry', () => {
        const schema = structuredClone(thresholdOpenApi);
        schema.components.schemas.SeasonalParams.properties.type.const = 'future-strategy';
        schema.components.schemas.SeasonalParams.properties.stdMultiplier.default = 3;
        const future = readThresholdStrategies(schema)[0];
        expect(future.id).toBe('future-strategy');
        expect(thresholdParameterDefaults(future)).toEqual({ stdMultiplier: '3' });
        expect(thresholdParameterValidator(future).parse({ type: future.id, stdMultiplier: '4' })).toEqual({ type: 'future-strategy', stdMultiplier: 4 });
    });
    it('fails explicitly if the server has no usable threshold union', () => {
        for (const schema of [null, {}, { paths: {} }]) expect(() => readThresholdStrategies(schema)).toThrow();
    });
});
