import { describe, expect, it } from 'vitest';
import { createNewPredictionFormSchema } from './useNewPredictionFormState';
import type { Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

const periodSettings: Dhis2PeriodSettings = {
    calendar: 'gregory',
    locale: 'en',
    timeZone: 'UTC',
};

const schema = createNewPredictionFormSchema({
    fromPeriod: '202301',
    anchorPeriod: '202512',
    periodSettings,
});

const periodErrors = (periodId: string | null) => (
    schema.safeParse({ name: 'Run 1', periodId })
        .error?.issues
        .filter(issue => issue.path[0] === 'periodId')
        .map(issue => issue.message) ?? []
);

describe('createNewPredictionFormSchema', () => {
    it('rejects a missing period', () => {
        for (const periodId of [null, '']) {
            expect(schema.safeParse({ name: 'Run 1', periodId }).success).toBe(false);
            expect(periodErrors(periodId)).toEqual(['Please select a period']);
        }
    });

    it('rejects a period later than the anchor period', () => {
        const result = schema.safeParse({ name: 'Run 1', periodId: '202601' });
        expect(result.success).toBe(false);
        expect(periodErrors('202601')).toEqual([
            'Period must be completed (cannot be later than last completed period)',
        ]);
    });

    it('rejects a period before the training start', () => {
        expect(schema.safeParse({ name: 'Run 1', periodId: '202212' }).success).toBe(false);
        expect(periodErrors('202212')).toEqual(['Period is before training start']);
    });

    it('rejects a period id that cannot be compared', () => {
        expect(schema.safeParse({ name: 'Run 1', periodId: 'not-a-period' }).success).toBe(false);
        expect(periodErrors('not-a-period')).toEqual(['Invalid period']);
    });

    it('accepts a period inside the training range, including the boundaries', () => {
        for (const periodId of ['202301', '202506', '202512']) {
            expect(schema.safeParse({ name: 'Run 1', periodId }).success).toBe(true);
        }
    });

    it('still requires a name', () => {
        const result = schema.safeParse({ name: '', periodId: '202506' });
        expect(result.success).toBe(false);
    });
});
