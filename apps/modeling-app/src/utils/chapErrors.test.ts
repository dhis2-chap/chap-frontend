import { describe, expect, it } from 'vitest';
import { getChapErrorMessage } from './chapErrors';

describe('getChapErrorMessage', () => {
    it('shows FastAPI field and model validation errors instead of the generic status', () => {
        expect(getChapErrorMessage({
            status: 422,
            message: 'Validation Error',
            body: { detail: [
                { loc: ['body', 'nPeriods'], msg: 'Input should be greater than 0' },
                { loc: ['body'], msg: 'Value error, n_retrain cannot exceed n_splits.' },
            ] },
        })).toBe('nPeriods: Input should be greater than 0\nValue error, n_retrain cannot exceed n_splits.');
    });

    it('supports string details and safely falls back for unrecognised responses', () => {
        expect(getChapErrorMessage({ body: { detail: 'Unknown weather provider' } })).toBe('Unknown weather provider');
        for (const body of [null, 'Bad gateway', { detail: {} }, { detail: [null, {}, 42] }]) {
            expect(getChapErrorMessage({ message: 'Request failed', body })).toBe('Request failed');
        }
    });

    it('preserves the actionable authorization message', () => {
        expect(getChapErrorMessage({ status: 401, body: { detail: 'Unauthorized' } })).toContain('API token');
    });
});
