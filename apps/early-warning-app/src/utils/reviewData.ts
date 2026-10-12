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
