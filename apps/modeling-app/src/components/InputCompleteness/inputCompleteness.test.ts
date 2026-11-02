import { describe, expect, it } from 'vitest';
import type { ObservationBase } from '@dhis2-chap/ui';
import { calculateInputCompleteness, getInputPeriods, indexObservations } from './inputCompleteness';

const observation = (period: string, orgUnit: string, featureName: string, value: number | null): ObservationBase => (
    { period, orgUnit, featureName, value }
);

describe('saved input completeness', () => {
    it('counts zero, but not null, absent or non-finite values, against the expected scope', () => {
        const values = indexObservations([
            observation('2026-01', 'a', 'cases', 0),
            observation('202601', 'a', 'rain', null),
            observation('202601', 'b', 'cases', NaN),
            observation('202601', 'b', 'rain', Infinity),
            observation('202601', 'outside', 'cases', 20),
            observation('202601', 'a', 'unused', 10),
        ]);
        const rows = calculateInputCompleteness(values, ['202601', '202602'], ['a', 'b', 'wholly-missing'], ['cases', 'rain', 'absent-variable']);

        expect(rows[0]).toMatchObject({ expected: 9, available: 1, zeros: 1, completeness: 1 / 9, locationsByVariable: [1, 0, 0] });
        expect(rows[0].missing).toEqual([
            { orgUnit: 'a', variables: ['rain', 'absent-variable'] },
            { orgUnit: 'b', variables: ['cases', 'rain', 'absent-variable'] },
            { orgUnit: 'wholly-missing', variables: ['cases', 'rain', 'absent-variable'] },
        ]);
        expect(rows[1]).toMatchObject({ expected: 9, available: 0, completeness: 0 });
    });

    it('includes every period in the range, and none for a missing or invalid range', () => {
        expect(getInputPeriods('2025-12', '202603', 'gregory')).toEqual(['202512', '202601', '202602', '202603']);
        expect(getInputPeriods('', '202601', 'gregory')).toEqual([]);
        expect(getInputPeriods('bad', '202601', 'gregory')).toEqual([]);
    });

    it('matches zero-padded weekly observations to generated weeks', () => {
        const values = indexObservations([observation('2025W01', 'a', 'cases', 12)]);
        const [week] = getInputPeriods('2025W01', '2025W01', 'gregory');
        expect(calculateInputCompleteness(values, [week], ['a'], ['cases'])[0].available).toBe(1);
    });
});
