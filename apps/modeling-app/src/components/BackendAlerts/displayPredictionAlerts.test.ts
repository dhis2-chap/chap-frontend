import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead, AlertRead } from '@dhis2-chap/ui';
import { displayPredictionAlerts } from './displayPredictionAlerts';
import { alertPolicyDisplaySchema, getAlertColor } from './alertLevelDisplay';

const policies = [
    { id: 1, name: 'Malaria', levels: [{ name: 'Watch' }, { name: 'Action' }] },
    { id: 2, name: 'Dengue', levels: [{ name: 'Watch' }] },
] as AlertPolicyRead[];
const alert = (id: number, policyId: number, level: string): AlertRead => ({
    id, alertPolicyId: policyId, level, predictionId: 7, orgUnit: 'region', timePeriod: '2026-10',
});

describe('recorded alert presentation', () => {
    it('keeps identically named levels separate by policy and labels them with the level name', () => {
        const result = displayPredictionAlerts([alert(1, 1, 'Watch'), alert(2, 2, 'Watch')], policies, {
            1: { Watch: { color: 'yellow' } },
            2: { Watch: { color: '#713a91' } },
        });
        expect(result.map(item => [item.level, item.display])).toEqual([
            ['Watch', { label: 'Watch', color: 'yellow' }],
            ['Watch', { label: 'Watch', color: '#713a91' }],
        ]);
    });

    it('orders recorded alerts by the saved severity ladder and falls back for existing policies', () => {
        const result = displayPredictionAlerts([alert(1, 1, 'Watch'), alert(2, 1, 'Action')], policies, {});
        expect(result.map(item => [item.id, item.display])).toEqual([
            [2, { label: 'Action', color: 'red' }],
            [1, { label: 'Watch', color: 'orange' }],
        ]);
    });

    it('preserves alerts when their policy cannot be loaded', () => {
        expect(displayPredictionAlerts([alert(1, 99, 'Action')], [], {})[0]).toMatchObject({
            id: 1, level: 'Action', display: { label: 'Action' },
        });
    });

    it('rejects invalid colours from stored settings', () => {
        expect(alertPolicyDisplaySchema.safeParse({ Watch: { color: '<script>' } }).success).toBe(false);
        expect(alertPolicyDisplaySchema.safeParse({ Watch: { color: '#12345' } }).success).toBe(false);
    });

    it('supports custom colours alongside saved presets', () => {
        const display = alertPolicyDisplaySchema.parse({ Watch: { color: '#FFFF00' }, Action: { color: 'red' } });
        expect(getAlertColor(display.Watch.color)).toEqual({ color: '#FFFF00', background: '#FFFF0026' });
        expect(getAlertColor(display.Action.color)).toMatchObject({ color: '#e53935', background: '#fce2e2' });
    });
});
