import { describe, it, expect } from 'vitest';
import { getPeriodLabel } from './getPeriodLabel';

describe('getPeriodLabel', () => {
    describe('MONTH', () => {
        it('formats a base period without step using server→client conversion', () => {
            expect(getPeriodLabel('202401', 'MONTH')).toBe('2024-01');
        });

        it('advances by step when step is provided', () => {
            expect(getPeriodLabel('202401_2', 'MONTH')).toBe('2024-03');
        });

        it('handles year rollover when stepping forward', () => {
            expect(getPeriodLabel('202412_1', 'MONTH')).toBe('2025-01');
        });

        it('falls back to base when the date is invalid', () => {
            expect(getPeriodLabel('not-a-date_1', 'MONTH')).toBe('not-a-date');
        });
    });

    describe('WEEK', () => {
        it('formats a base ISO week period without step', () => {
            expect(getPeriodLabel('2024W05', 'WEEK')).toBe('2024-W05');
        });

        it('advances by step when step is provided', () => {
            expect(getPeriodLabel('2024W05_2', 'WEEK')).toBe('2024-W07');
        });

        it('falls back to base when the date is invalid', () => {
            expect(getPeriodLabel('badweek_1', 'WEEK')).toBe('badweek');
        });
    });

    describe('malformed input', () => {
        it('returns the period unchanged when periodType is missing', () => {
            expect(getPeriodLabel('202401', null)).toBe('202401');
            expect(getPeriodLabel('202401', undefined)).toBe('202401');
        });

        it('returns the base when step is non-numeric and conversion fails', () => {
            expect(getPeriodLabel('not-a-date_x', 'MONTH')).toBe('not-a-date');
        });
    });
});
