import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead, AlertRead } from '@dhis2-chap/ui';
import { getPredictionAlertStatus } from './predictionAlertStatus';

const malaria = { id: 1, name: 'Malaria', levels: [{ name: 'Watch' }] } as AlertPolicyRead;
const dengue = { id: 2, name: 'Dengue', levels: [{ name: 'Watch' }] } as AlertPolicyRead;
const alert = (id: number, policyId: number): AlertRead => ({
    id, alertPolicyId: policyId, level: 'Watch', predictionId: 7, orgUnit: 'region', timePeriod: '2026-10',
});

describe('prediction alert status', () => {
    it('uses the recorded policy, even when it raised no alerts', () => {
        expect(getPredictionAlertStatus({ alerts: [], policies: [malaria, dengue], policyId: 2 }))
            .toEqual({ kind: 'policy', policies: [dengue], alertCount: 0 });
    });

    it('names the policy that raised the alerts for runs without a recorded policy', () => {
        expect(getPredictionAlertStatus({ alerts: [alert(1, 1), alert(2, 1)], policies: [malaria, dengue], policyId: null }))
            .toEqual({ kind: 'policy', policies: [malaria], alertCount: 2 });
    });

    it('only reports no policy when Chap records it', () => {
        expect(getPredictionAlertStatus({ alerts: [], policies: [malaria], policyId: null }))
            .toEqual({ kind: 'noPolicy' });
        expect(getPredictionAlertStatus({ alerts: [], policies: [malaria], policyId: undefined }))
            .toEqual({ kind: 'noAlerts' });
    });
});
