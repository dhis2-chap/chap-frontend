import type { AlertPolicyRead, AlertRead } from '@dhis2-chap/ui';

// Chap does not record which policy a prediction ran with: alerts are raised
// against the setup's policy when the run finishes. Without alerts, the setup's
// current policy may have been attached after this run, so it is only a hint.
export type PredictionAlertStatus =
    | { kind: 'raised'; policies: AlertPolicyRead[]; alertCount: number }
    | { kind: 'noPolicy' }
    | { kind: 'noAlerts'; setupPolicy: AlertPolicyRead | undefined };

export const getPredictionAlertStatus = ({
    alerts,
    policies,
    setupPolicy,
}: {
    alerts: AlertRead[];
    policies: AlertPolicyRead[];
    // null when the run has no setup or its setup has no policy; undefined when unknown
    setupPolicy: AlertPolicyRead | null | undefined;
}): PredictionAlertStatus => {
    if (alerts.length > 0) {
        const policyIds = new Set(alerts.map(alert => alert.alertPolicyId));
        return {
            kind: 'raised',
            policies: policies.filter(policy => policyIds.has(policy.id)),
            alertCount: alerts.length,
        };
    }
    if (setupPolicy === null) {
        return { kind: 'noPolicy' };
    }
    return { kind: 'noAlerts', setupPolicy };
};
