import { canonicalizePeriodId } from '@dhis2-chap/core';
import { sortAlertLevels, type AlertPolicyRead, type AlertRead, type PredictionInfo } from '@dhis2-chap/ui';

// A level's index in the strictness order is its severity, the order the backend uses.
export const severity = (alert: AlertRead, policies: AlertPolicyRead[]) => {
    const levels = sortAlertLevels(policies.find(policy => policy.id === alert.alertPolicyId)?.levels ?? []);
    const index = levels.findIndex(level => level.name === alert.level);
    return index === -1 ? levels.length : index;
};

const countLevels = (alerts: AlertRead[], policies: AlertPolicyRead[]) => {
    const counts = new Map<string, { level: string; count: number; severity: number }>();
    for (const alert of alerts) {
        const entry = counts.get(alert.level) ?? { level: alert.level, count: 0, severity: Infinity };
        entry.count++;
        entry.severity = Math.min(entry.severity, severity(alert, policies));
        counts.set(alert.level, entry);
    }
    return [...counts.values()]
        .sort((a, b) => a.severity - b.severity || a.level.localeCompare(b.level))
        .map(({ level, count }) => ({ level, count }));
};

/** Predictions with pending alerts, newest first, with counts per level from least to most severe. */
export const summarizePredictionReviews = (
    pendingAlerts: AlertRead[],
    predictions: PredictionInfo[],
    policies: AlertPolicyRead[],
) => {
    const byPrediction = new Map<number, AlertRead[]>();
    for (const alert of pendingAlerts) {
        if (alert.predictionId == null) continue;
        byPrediction.set(alert.predictionId, [...byPrediction.get(alert.predictionId) ?? [], alert]);
    }
    return predictions.flatMap((prediction) => {
        const alerts = byPrediction.get(prediction.id);
        return alerts ? [{ prediction, levelCounts: countLevels(alerts, policies) }] : [];
    }).sort((a, b) => Date.parse(b.prediction.created) - Date.parse(a.prediction.created)
        || b.prediction.id - a.prediction.id);
};

/** Alerts may use CHAP's dashed IDs while analytics uses DHIS2 period IDs. */
export const normalizeAlertPeriod = (period: string) => (
    canonicalizePeriodId(period.trim().replace(/^(\d{4})-(?=\d{2}$|W)/, '$1'))
);
