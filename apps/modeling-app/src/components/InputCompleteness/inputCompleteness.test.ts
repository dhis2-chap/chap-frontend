import { describe, expect, it } from 'vitest';
import type { ObservationBase } from '@dhis2-chap/ui';
import { calculateInputCompleteness, getInputPeriods } from './inputCompleteness';

const observation = (period: string, orgUnit: string, featureName: string, value: number | null): ObservationBase => (
    { period, orgUnit, featureName, value }
);

describe('saved input completeness', () => {
    it('counts zero, but not null, absent or non-finite values, against the expected scope', () => {
        const rows = calculateInputCompleteness([
            observation('2026-01', 'a', 'cases', 0),
            observation('202601', 'a', 'rain', null),
            observation('202601', 'b', 'cases', NaN),
            observation('202601', 'b', 'rain', Infinity),
            observation('202601', 'outside', 'cases', 20),
            observation('202601', 'a', 'unused', 10),
            observation('202601', 'a', 'cases', 0),
        ], ['202601', '202602'], ['a', 'b', 'wholly-missing'], ['cases', 'rain', 'absent-variable']);

        expect(rows[0]).toMatchObject({ expected: 9, available: 1, zeros: 1, completeness: 1 / 9 });
        expect(rows[0].missing).toEqual([
            { orgUnit: 'a', variables: ['rain', 'absent-variable'] },
            { orgUnit: 'b', variables: ['cases', 'rain', 'absent-variable'] },
            { orgUnit: 'wholly-missing', variables: ['cases', 'rain', 'absent-variable'] },
        ]);
        expect(rows[1]).toMatchObject({ expected: 9, available: 0, completeness: 0 });
    });

    it('does not count duplicate locations, variables or observation rows twice', () => {
        const rows = calculateInputCompleteness([
            observation('2026-W1', 'a', 'cases', 2),
            observation('2026W01', 'a', 'cases', 2),
        ], ['2026W01'], ['a', 'a'], ['cases', 'cases']);
        expect(rows[0]).toEqual({ period: '2026W01', expected: 1, available: 1, zeros: 0, completeness: 1, missing: [] });
    });

    it('reports a zero denominator as unavailable', () => {
        expect(calculateInputCompleteness([], ['202601'], [], ['cases'])[0].completeness).toBeNull();
        expect(calculateInputCompleteness([], ['202601'], ['a'], [])[0].completeness).toBeNull();
    });

    it('includes every month in the selected range, including wholly missing periods', () => {
        expect(getInputPeriods('2025-12', '202603')).toEqual(['202512', '202601', '202602', '202603']);
    });

    it('fills weekly ranges across an ISO week-year boundary', () => {
        expect(getInputPeriods('2020-W52', '2021W02')).toEqual(['2020W52', '2020W53', '2021W01', '2021W02']);
    });

    it('rejects invalid, reversed, missing and mixed-granularity ranges', () => {
        for (const [start, end] of [['', '202601'], ['bad', '202601'], ['202602', '202601'], ['202601', '2026W01']]) {
            expect(getInputPeriods(start, end)).toEqual([]);
        }
        expect(getInputPeriods('202601', '202602', 'week')).toEqual([]);
        expect(getInputPeriods('2026W01', '2026W02', 'month')).toEqual([]);
    });
});
