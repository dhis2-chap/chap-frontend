import type { AlertPolicyRead, AlertRead, PredictionInfo } from '@dhis2-chap/ui';

type LevelCount = { level: string; count: number };

// Policies store levels from least to most severe, so a level's index is its severity.
const severity = (alert: AlertRead, policies: AlertPolicyRead[]) => {
    const levels = policies.find(policy => policy.id === alert.alertPolicyId)?.levels ?? [];
    const index = levels.findIndex(level => level.name === alert.level);
    return index === -1 ? levels.length : index;
};

/** Predictions with pending alerts, newest first, with pending counts per level from least to most severe. */
export const summarizePredictionReviews = (
    alerts: AlertRead[],
    predictions: PredictionInfo[],
    policies: AlertPolicyRead[],
) => {
    const byPrediction = new Map<number, AlertRead[]>();
    for (const alert of alerts) {
        if (alert.predictionId == null || (alert.approved && alert.approved !== 'pending')) continue;
        const group = byPrediction.get(alert.predictionId) ?? [];
        group.push(alert);
        byPrediction.set(alert.predictionId, group);
    }
    return predictions.flatMap((prediction) => {
        const pending = byPrediction.get(prediction.id);
        if (!pending) return [];
        const sorted = [...pending].sort((a, b) => severity(a, policies) - severity(b, policies)
            || a.level.localeCompare(b.level));
        const levelCounts: LevelCount[] = [];
        for (const alert of sorted) {
            const last = levelCounts[levelCounts.length - 1];
            if (last?.level === alert.level) last.count++;
            else levelCounts.push({ level: alert.level, count: 1 });
        }
        return [{ prediction, levelCounts }];
    }).sort((a, b) => Date.parse(b.prediction.created) - Date.parse(a.prediction.created)
        || b.prediction.id - a.prediction.id);
};
