import { describe, expect, it } from 'vitest';
import { backtestParametersSchema } from './backtestParameters';

const VALID_PARAMETERS = { nPeriods: 3, nSplits: 7, stride: 1, nRetrain: 1, futureWeatherProvider: 'climatology' };

describe('backtest parameters', () => {
    it('accepts valid parameters and retraining on every split', () => {
        expect(backtestParametersSchema.parse(VALID_PARAMETERS)).toEqual({
            nPeriods: 3, nSplits: 7, stride: 1, nRetrain: 1, futureWeatherProvider: 'climatology',
        });
        expect(backtestParametersSchema.safeParse({ ...VALID_PARAMETERS, nSplits: 2, nRetrain: 2 }).success).toBe(true);
    });

    it.each(['nPeriods', 'nSplits', 'stride', 'nRetrain'] as const)('rejects invalid %s counts', (field) => {
        for (const value of [0, -1, 1.5, NaN, Infinity, undefined]) {
            const result = backtestParametersSchema.safeParse({ ...VALID_PARAMETERS, [field]: value });
            expect(result.success).toBe(false);
            if (!result.success) expect(result.error.issues[0].path).toEqual([field]);
        }
    });

    it('attaches the cross-field error to retrains when splits are reduced', () => {
        const result = backtestParametersSchema.safeParse({ ...VALID_PARAMETERS, nSplits: 1, nRetrain: 2 });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.issues[0].path).toEqual(['nRetrain']);
    });

    it('requires a provider id without hard-coding the server registry', () => {
        expect(backtestParametersSchema.safeParse({ ...VALID_PARAMETERS, futureWeatherProvider: '' }).success).toBe(false);
        expect(backtestParametersSchema.parse({ ...VALID_PARAMETERS, futureWeatherProvider: 'custom-provider' }).futureWeatherProvider).toBe('custom-provider');
    });
});
