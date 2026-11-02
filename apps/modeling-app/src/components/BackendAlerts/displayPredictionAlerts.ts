import type { AlertPolicyRead, AlertRead } from '@dhis2-chap/ui';
import { getAlertLevelDisplay, type AlertLevelDisplay, type AlertPolicyDisplay } from './alertLevelDisplay';

export type DisplayedPredictionAlert = AlertRead & {
    display: AlertLevelDisplay;
    severity: number;
};

export const displayPredictionAlerts = (
    alerts: AlertRead[],
    policies: AlertPolicyRead[],
    displays: Record<number, AlertPolicyDisplay | undefined>,
): DisplayedPredictionAlert[] => alerts.map((alert) => {
    const policy = policies.find(item => item.id === alert.alertPolicyId);
    return {
        ...alert,
        display: getAlertLevelDisplay(alert.level, policy, displays[alert.alertPolicyId]),
        severity: policy?.levels?.findIndex(level => level.name === alert.level) ?? -1,
    };
}).sort((a, b) => b.severity - a.severity || a.orgUnit.localeCompare(b.orgUnit) || a.timePeriod.localeCompare(b.timePeriod));
