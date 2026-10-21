import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead, AlertRead } from '@dhis2-chap/ui';
import { getPredictionAlertStatus } from './predictionAlertStatus';

const malaria = { id: 1, name: 'Malaria', levels: [{ name: 'Watch' }] } as AlertPolicyRead;
const dengue = { id: 2, name: 'Dengue', levels: [{ name: 'Watch' }] } as AlertPolicyRead;
const alert = (id: number, policyId: number): AlertRead => ({
    id, alertPolicyId: policyId, level: 'Watch', predictionId: 7, orgUnit: 'region', timePeriod: '2026-10',
});

describe('prediction alert status', () => {
    it('names the policy that raised the alerts, even if the setup has since changed policy', () => {
        expect(getPredictionAlertStatus({
            alerts: [alert(1, 1), alert(2, 1)],
            policies: [malaria, dengue],
            setupPolicy: dengue,
        })).toEqual({ kind: 'raised', policies: [malaria], alertCount: 2 });
    });

    it('reports no policy when the run has no setup policy and no alerts', () => {
        expect(getPredictionAlertStatus({ alerts: [], policies: [malaria], setupPolicy: null }))
            .toEqual({ kind: 'noPolicy' });
    });

    it('does not claim there is no policy when the setup could not be loaded', () => {
        expect(getPredictionAlertStatus({ alerts: [], policies: [malaria], setupPolicy: undefined }))
            .toEqual({ kind: 'noAlerts', setupPolicy: undefined });
    });

    it('does not claim the run used the setup policy when no alerts were recorded', () => {
        expect(getPredictionAlertStatus({ alerts: [], policies: [malaria], setupPolicy: malaria }))
            .toEqual({ kind: 'noAlerts', setupPolicy: malaria });
    });
});
