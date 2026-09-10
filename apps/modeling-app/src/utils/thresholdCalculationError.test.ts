import { describe, expect, it } from 'vitest';
import { getThresholdCalculationErrorDetail } from './thresholdCalculationError';

describe('getThresholdCalculationErrorDetail', () => {
    it('preserves the backend explanation of an unavailable baseline', () => {
        const detail = 'No observations in the 1-year baseline window 2025-2025';
        expect(getThresholdCalculationErrorDetail({ status: 400, body: { detail } })).toBe(detail);
    });

    it('extracts validation messages without echoing request inputs', () => {
        expect(getThresholdCalculationErrorDetail({
            status: 422,
            body: { detail: [
                { msg: 'Input should be greater than or equal to 1', input: -2 },
                { msg: 'Input should be greater than or equal to 1', input: -3 },
                { unexpected: 'ignored' },
            ] },
        })).toBe('Input should be greater than or equal to 1');
    });

    it('uses the generic fallback for server errors and malformed details', () => {
        for (const error of [
            { status: 500, body: { detail: 'Internal failure' } },
            { status: 400, body: undefined },
            { status: 400, body: { detail: { message: 'unexpected shape' } } },
            { status: 422, body: { detail: [null, { msg: 42 }, { msg: ' ' }] } },
        ]) {
            expect(getThresholdCalculationErrorDetail(error)).toBeUndefined();
        }
    });
});
