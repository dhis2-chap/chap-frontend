import { canonicalizePeriodId } from '@dhis2-chap/core';
import type { AlertPolicyRead, AlertRead, PredictionInfo } from '@dhis2-chap/ui';

// Policies store levels from least to most severe, so a level's index is its severity.
export const severity = (alert: AlertRead, policies: AlertPolicyRead[]) => {
    const levels = policies.find(policy => policy.id === alert.alertPolicyId)?.levels ?? [];
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

/** Linear estimate between quantiles; outside the observed range only a bound is known. */
export const estimateExceedance = (
    quantiles: Partial<Record<string, number>>,
    threshold: number,
): { probability: number; bound?: 'above' | 'below' } | undefined => {
    const levels = [
        ['quantile_low', 0.1], ['quantile_mid_low', 0.25], ['median', 0.5],
        ['quantile_mid_high', 0.75], ['quantile_high', 0.9],
    ] as const;
    const points = levels.flatMap(([key, quantile]) => {
        const value = quantiles[key];
        return value != null && Number.isFinite(value) ? [{ value, quantile }] : [];
    });
    if (!points.length || !Number.isFinite(threshold)) return undefined;
    if (points.some((point, index) => index > 0 && point.value < points[index - 1].value)) return undefined;
    if (threshold < points[0].value) return { probability: 1 - points[0].quantile, bound: 'above' };
    if (threshold >= points[points.length - 1].value) return { probability: 1 - points[points.length - 1].quantile, bound: 'below' };
    for (let index = 1; index < points.length; index++) {
        const lower = points[index - 1];
        const upper = points[index];
        if (threshold >= lower.value && threshold < upper.value) {
            const fraction = (threshold - lower.value) / (upper.value - lower.value);
            return { probability: 1 - lower.quantile - fraction * (upper.quantile - lower.quantile) };
        }
    }
    return undefined;
};

/** Alerts may use CHAP's dashed IDs while analytics uses DHIS2 period IDs. */
export const normalizeAlertPeriod = (period: string) => (
    canonicalizePeriodId(period.trim().replace(/^(\d{4})-(?=\d{2}$|W)/, '$1'))
);
