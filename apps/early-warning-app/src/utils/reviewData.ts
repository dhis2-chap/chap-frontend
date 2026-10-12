import { canonicalizePeriodId } from '@dhis2-chap/core';
import type { AlertRead, PredictionInfo } from '@dhis2-chap/ui';

export const summarizePredictionReviews = (alerts: AlertRead[], predictions: PredictionInfo[]) => {
    const byPrediction = new Map<number, AlertRead[]>();
    for (const alert of alerts) {
        if (alert.predictionId == null) continue;
        const group = byPrediction.get(alert.predictionId) ?? [];
        group.push(alert);
        byPrediction.set(alert.predictionId, group);
    }
    return predictions.flatMap((prediction) => {
        const predictionAlerts = byPrediction.get(prediction.id);
        if (!predictionAlerts) return [];
        const pending = predictionAlerts.filter(alert => !alert.approved || alert.approved === 'pending');
        const reviewed = predictionAlerts.filter(alert => alert.approved && alert.approved !== 'pending');
        return [{
            prediction,
            alerts: predictionAlerts,
            pending: pending.length,
            accepted: reviewed.filter(alert => alert.approved === 'approved').length,
            declined: reviewed.filter(alert => alert.approved === 'declined').length,
            pendingLevelCounts: pending.reduce<Record<string, number>>((counts, alert) => {
                counts[alert.level] = (counts[alert.level] ?? 0) + 1;
                return counts;
            }, {}),
            reviewers: [...new Set(reviewed.flatMap(alert => alert.approvedBy ? [alert.approvedBy] : []))],
            lastReviewedAt: reviewed.flatMap(alert => alert.approvedAt ? [alert.approvedAt] : []).sort().slice(-1)[0],
        }];
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
