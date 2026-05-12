import { describe, expect, it } from 'vitest';
import {
    getCronExpressionDescription,
    isValidCronExpression,
    toFiveFieldCronExpression,
} from './cronSchedule';

describe('cronSchedule', () => {
    describe('isValidCronExpression', () => {
        it('accepts a five-field cron expression', () => {
            expect(isValidCronExpression('0 12 * * 1-3')).toBe(true);
        });

        it('rejects expressions with the wrong number of fields', () => {
            expect(isValidCronExpression('0 0 12 * * 1-3')).toBe(false);
        });

        it('rejects values outside supported ranges', () => {
            expect(isValidCronExpression('0 25 * * 1-3')).toBe(false);
        });

        it('allows question marks in day fields only', () => {
            expect(isValidCronExpression('0 12 ? * MON')).toBe(true);
            expect(isValidCronExpression('? 12 * * MON')).toBe(false);
        });
    });

    describe('getCronExpressionDescription', () => {
        it('describes a weekday range schedule', () => {
            expect(getCronExpressionDescription('0 12 * * 1-3')).toBe(
                'At 12:00 PM, Monday through Wednesday',
            );
        });

        it('describes a named weekday schedule', () => {
            expect(getCronExpressionDescription('30 3 * * MON,WED')).toBe(
                'At 3:30 AM, Monday, Wednesday',
            );
        });

        it('returns undefined for invalid expressions', () => {
            expect(getCronExpressionDescription('not cron')).toBeUndefined();
        });
    });

    describe('toFiveFieldCronExpression', () => {
        it('drops a seconds field from existing six-field expressions', () => {
            expect(toFiveFieldCronExpression('0 0 12 * * 1-3')).toBe('0 12 * * 1-3');
        });

        it('leaves five-field expressions unchanged', () => {
            expect(toFiveFieldCronExpression('0 12 * * 1-3')).toBe('0 12 * * 1-3');
        });
    });
});
