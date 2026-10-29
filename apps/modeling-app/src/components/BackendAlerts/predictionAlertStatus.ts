import type { AlertPolicyRead, AlertRead } from '@dhis2-chap/ui';

// Chap records the policy a run used from 2.6.0. Older runs still name the
// policies that raised their alerts.
export type PredictionAlertStatus =
    | { kind: 'policy'; policies: AlertPolicyRead[]; alertCount: number }
    | { kind: 'noPolicy' }
    | { kind: 'noAlerts' };

export const getPredictionAlertStatus = ({
    alerts,
    policies,
    policyId,
}: {
    alerts: AlertRead[];
    policies: AlertPolicyRead[];
    // undefined when this Chap version does not record the policy
    policyId: number | null | undefined;
}): PredictionAlertStatus => {
    const policyIds = new Set(alerts.map(alert => alert.alertPolicyId));
    if (policyId != null) policyIds.add(policyId);
    if (policyIds.size === 0) {
        return { kind: policyId === null ? 'noPolicy' : 'noAlerts' };
    }
    return {
        kind: 'policy',
        policies: policies.filter(policy => policyIds.has(policy.id)),
        alertCount: alerts.length,
    };
};
