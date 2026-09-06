import { describe, expect, it } from 'vitest';
import {
    areThresholdParamsEqual,
    describeThresholdParams,
    getDefaultThresholdParams,
    getThresholdLineRoles,
    isKnownThresholdStrategy,
    paramsToFormValues,
    parseThresholdParams,
    withStrategyFormValues,
} from './thresholdStrategyParams';

describe('getDefaultThresholdParams', () => {
    it('returns the UI presets per strategy', () => {
        expect(getDefaultThresholdParams('seasonal')).toEqual({
            type: 'seasonal',
            stdMultiplier: 2,
        });
        expect(getDefaultThresholdParams('percentile')).toEqual({
            type: 'percentile',
            quantile: [0.25, 0.75],
            baselineYears: 5,
        });
    });

    it('returns an independent copy on every call', () => {
        const seasonal = getDefaultThresholdParams('seasonal');
        const percentile = getDefaultThresholdParams('percentile');

        if (seasonal.type === 'seasonal') {
            seasonal.stdMultiplier = 99;
        }
        if (percentile.type === 'percentile') {
            percentile.quantile[0] = 0.99;
            percentile.baselineYears = 99;
        }

        expect(getDefaultThresholdParams('seasonal')).toEqual({
            type: 'seasonal',
            stdMultiplier: 2,
        });
        expect(getDefaultThresholdParams('percentile')).toEqual({
            type: 'percentile',
            quantile: [0.25, 0.75],
            baselineYears: 5,
        });
    });
});

describe('areThresholdParamsEqual', () => {
    it('compares seasonal params by std multiplier', () => {
        expect(areThresholdParamsEqual(
            { type: 'seasonal', stdMultiplier: 2 },
            { type: 'seasonal', stdMultiplier: 2 },
        )).toBe(true);
        expect(areThresholdParamsEqual(
            { type: 'seasonal', stdMultiplier: 2 },
            { type: 'seasonal', stdMultiplier: 3 },
        )).toBe(false);
    });

    it('compares percentile params by quantiles and baseline', () => {
        expect(areThresholdParamsEqual(
            { type: 'percentile', quantile: [0.25, 0.75], baselineYears: null },
            { type: 'percentile', quantile: [0.25, 0.75], baselineYears: null },
        )).toBe(true);
        expect(areThresholdParamsEqual(
            { type: 'percentile', quantile: [0.25, 0.75], baselineYears: 5 },
            { type: 'percentile', quantile: [0.25, 0.75], baselineYears: null },
        )).toBe(false);
        expect(areThresholdParamsEqual(
            { type: 'percentile', quantile: [0.1, 0.75], baselineYears: 5 },
            { type: 'percentile', quantile: [0.25, 0.75], baselineYears: 5 },
        )).toBe(false);
    });

    it('treats different strategies as unequal', () => {
        expect(areThresholdParamsEqual(
            { type: 'seasonal', stdMultiplier: 2 },
            { type: 'percentile', quantile: [0.25, 0.75], baselineYears: 5 },
        )).toBe(false);
    });
});

describe('isKnownThresholdStrategy', () => {
    it('accepts only strategies with a frontend param config', () => {
        expect(isKnownThresholdStrategy('seasonal')).toBe(true);
        expect(isKnownThresholdStrategy('percentile')).toBe(true);
        expect(isKnownThresholdStrategy('bogus')).toBe(false);
        expect(isKnownThresholdStrategy('constructor')).toBe(false);
        expect(isKnownThresholdStrategy('__proto__')).toBe(false);
        expect(isKnownThresholdStrategy('toString')).toBe(false);
    });
});

describe('getThresholdLineRoles', () => {
    it('uses the only line as upper for a scalar line parameter', () => {
        expect(getThresholdLineRoles({ type: 'seasonal', stdMultiplier: 2 })).toEqual({
            upperIndex: 0,
        });
    });

    it('maps the smallest and largest echoed quantiles to lower and upper', () => {
        expect(getThresholdLineRoles({
            type: 'percentile',
            quantile: [0.25, 0.75],
            baselineYears: 5,
        })).toEqual({
            lowerIndex: 0,
            upperIndex: 1,
        });
        expect(getThresholdLineRoles({
            type: 'percentile',
            quantile: [0.75, 0.25],
            baselineYears: 5,
        })).toEqual({
            lowerIndex: 1,
            upperIndex: 0,
        });
    });

    it('derives the roles from the echoed line values even without a type label', () => {
        expect(getThresholdLineRoles({ quantile: [0.25, 0.75] })).toEqual({
            lowerIndex: 0,
            upperIndex: 1,
        });
    });

    it('falls back to a single upper line for scalar or single-element lists', () => {
        expect(getThresholdLineRoles({ type: 'percentile', quantile: 0.75 })).toEqual({
            upperIndex: 0,
        });
        expect(getThresholdLineRoles({ type: 'percentile', quantile: [0.75] })).toEqual({
            upperIndex: 0,
        });
        expect(getThresholdLineRoles({})).toEqual({
            upperIndex: 0,
        });
    });
});

describe('paramsToFormValues', () => {
    it('renders percentile params as percent strings and keeps other fields at defaults', () => {
        expect(paramsToFormValues({
            type: 'percentile',
            quantile: [0.25, 0.75],
            baselineYears: 5,
        })).toEqual({
            stdMultiplier: '2',
            lowerPercentile: '25',
            upperPercentile: '75',
            baselineYears: '5',
        });
    });

    it('renders a null baseline (all history) as an empty string', () => {
        expect(paramsToFormValues({
            type: 'percentile',
            quantile: [0.1, 0.9],
            baselineYears: null,
        })).toMatchObject({
            lowerPercentile: '10',
            upperPercentile: '90',
            baselineYears: '',
        });
    });

    it('round-trips percentile params without losing decimal precision', () => {
        const params = {
            type: 'percentile' as const,
            quantile: [0.2555, 0.7445] as [number, number],
            baselineYears: 5,
        };
        const formValues = paramsToFormValues(params);

        expect(formValues).toMatchObject({
            lowerPercentile: '25.55',
            upperPercentile: '74.45',
        });
        expect(parseThresholdParams('percentile', formValues)).toEqual({ params });
    });

    it('does not expose floating-point multiplication noise', () => {
        expect(paramsToFormValues({
            type: 'percentile',
            quantile: [0.145, 0.855],
            baselineYears: 5,
        })).toMatchObject({
            lowerPercentile: '14.5',
            upperPercentile: '85.5',
        });
    });

    it('renders seasonal params with percentile fields at defaults', () => {
        expect(paramsToFormValues({
            type: 'seasonal',
            stdMultiplier: 2.5,
        })).toEqual({
            stdMultiplier: '2.5',
            lowerPercentile: '25',
            upperPercentile: '75',
            baselineYears: '5',
        });
    });
});

describe('withStrategyFormValues', () => {
    it('overwrites only the fields of the params\' own strategy', () => {
        const formValues = {
            stdMultiplier: '3',
            lowerPercentile: '10',
            upperPercentile: '90',
            baselineYears: '2',
        };

        expect(withStrategyFormValues(formValues, { type: 'seasonal', stdMultiplier: 1.5 })).toEqual({
            ...formValues,
            stdMultiplier: '1.5',
        });
        expect(withStrategyFormValues(formValues, {
            type: 'percentile',
            quantile: [0.25, 0.75],
            baselineYears: null,
        })).toEqual({
            stdMultiplier: '3',
            lowerPercentile: '25',
            upperPercentile: '75',
            baselineYears: '',
        });
    });
});

describe('parseThresholdParams', () => {
    const validForm = {
        stdMultiplier: '2',
        lowerPercentile: '25',
        upperPercentile: '75',
        baselineYears: '5',
    };

    it('builds seasonal params from the std multiplier field', () => {
        expect(parseThresholdParams('seasonal', { ...validForm, stdMultiplier: '2.5' })).toEqual({
            params: {
                type: 'seasonal',
                stdMultiplier: 2.5,
            },
        });
    });

    it('rejects a missing or non-numeric or negative std multiplier', () => {
        for (const stdMultiplier of ['', 'abc', '-1']) {
            const result = parseThresholdParams('seasonal', { ...validForm, stdMultiplier });
            expect(result.errors?.stdMultiplier).toBeTruthy();
            expect(result.params).toBeUndefined();
        }
    });

    it('builds percentile params converting percents to fractions', () => {
        expect(parseThresholdParams('percentile', {
            ...validForm,
            lowerPercentile: '10',
            upperPercentile: '90',
            baselineYears: '3',
        })).toEqual({
            params: {
                type: 'percentile',
                quantile: [0.1, 0.9],
                baselineYears: 3,
            },
        });
    });

    it('treats an empty baseline as all history (null)', () => {
        expect(parseThresholdParams('percentile', { ...validForm, baselineYears: '' })).toEqual({
            params: {
                type: 'percentile',
                quantile: [0.25, 0.75],
                baselineYears: null,
            },
        });
    });

    it('rejects percentiles outside 0-100 and a lower bound at or above the upper', () => {
        expect(parseThresholdParams('percentile', { ...validForm, upperPercentile: '101' })
            .errors?.upperPercentile).toBeTruthy();
        expect(parseThresholdParams('percentile', { ...validForm, lowerPercentile: '-1' })
            .errors?.lowerPercentile).toBeTruthy();
        expect(parseThresholdParams('percentile', { ...validForm, lowerPercentile: '75' })
            .errors?.lowerPercentile).toBeTruthy();
        expect(parseThresholdParams('percentile', { ...validForm, lowerPercentile: '80' })
            .errors?.lowerPercentile).toBeTruthy();
    });

    it('rejects a non-integer or sub-1 baseline', () => {
        for (const baselineYears of ['0', '2.5', 'abc']) {
            const result = parseThresholdParams('percentile', { ...validForm, baselineYears });
            expect(result.errors?.baselineYears).toBeTruthy();
            expect(result.params).toBeUndefined();
        }
    });
});

describe('describeThresholdParams', () => {
    it('summarizes seasonal params', () => {
        expect(describeThresholdParams({
            type: 'seasonal',
            stdMultiplier: 2.5,
        })).toBe('2.5 standard deviations above seasonal mean');
    });

    it('summarizes percentile params with a year baseline', () => {
        expect(describeThresholdParams({
            type: 'percentile',
            quantile: [0.25, 0.75],
            baselineYears: 5,
        })).toBe('25-75 percentile, 5-year baseline');
    });

    it('summarizes percentile params with an all-history baseline', () => {
        expect(describeThresholdParams({
            type: 'percentile',
            quantile: [0.1, 0.9],
            baselineYears: null,
        })).toBe('10-90 percentile, all-history baseline');
    });
});
