import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead, AlertRead } from '@dhis2-chap/ui';
import { displayPredictionAlerts } from './displayPredictionAlerts';
import { alertPolicyDisplaySchema } from './alertLevelDisplay';

const policies = [
    { id: 1, name: 'Malaria', levels: [{ name: 'Watch' }, { name: 'Action' }] },
    { id: 2, name: 'Dengue', levels: [{ name: 'Watch' }] },
] as AlertPolicyRead[];
const alert = (id: number, policyId: number, level: string): AlertRead => ({
    id, alertPolicyId: policyId, level, predictionId: 7, orgUnit: 'region', timePeriod: '2026-10',
});

describe('recorded alert presentation', () => {
    it('keeps identically named levels separate by policy and does not change recorded identifiers', () => {
        const result = displayPredictionAlerts([alert(1, 1, 'Watch'), alert(2, 2, 'Watch')], policies, new Map([
            [1, { Watch: { label: 'Surveillance', color: 'yellow' } }],
            [2, { Watch: { label: 'Investigate', color: 'purple' } }],
        ]));
        expect(result.map(item => [item.level, item.display])).toEqual([
            ['Watch', { label: 'Surveillance', color: 'yellow' }],
            ['Watch', { label: 'Investigate', color: 'purple' }],
        ]);
    });

    it('orders recorded alerts by the saved severity ladder and falls back for existing policies', () => {
        const result = displayPredictionAlerts([alert(1, 1, 'Watch'), alert(2, 1, 'Action')], policies, new Map());
        expect(result.map(item => [item.id, item.display])).toEqual([
            [2, { label: 'Action', color: 'red' }],
            [1, { label: 'Watch', color: 'orange' }],
        ]);
    });

    it('preserves alerts when their policy cannot be loaded', () => {
        expect(displayPredictionAlerts([alert(1, 99, 'Action')], [], new Map())[0]).toMatchObject({
            id: 1, level: 'Action', display: { label: 'Action' },
        });
    });

    it('rejects empty labels and invalid colours from stored settings', () => {
        expect(alertPolicyDisplaySchema.safeParse({ Watch: { label: ' ', color: 'orange' } }).success).toBe(false);
        expect(alertPolicyDisplaySchema.safeParse({ Watch: { label: 'Watch', color: '<script>' } }).success).toBe(false);
    });
});
