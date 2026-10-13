import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead, AlertRead, PredictionInfo } from '@dhis2-chap/ui';
import { summarizePredictionReviews } from './reviewData';

const prediction = (id: number, created: string) => ({ id, created }) as PredictionInfo;
const alert = (id: number, predictionId: number, level = 'Monitor', alertPolicyId = 1) => (
    { id, predictionId, level, alertPolicyId } as AlertRead
);
const policy = (id: number, levels: string[]) => ({ id, levels: levels.map(name => ({ name })) }) as AlertPolicyRead;

describe('prediction review queue', () => {
    it('sorts by creation time rather than prediction id and excludes predictions without pending alerts', () => {
        const result = summarizePredictionReviews(
            [alert(1, 10), alert(2, 2)],
            [prediction(10, '2026-01-01'), prediction(2, '2026-02-01'), prediction(3, '2026-03-01')],
            [policy(1, ['Monitor', 'Alert'])],
        );
        expect(result.map(review => review.prediction.id)).toEqual([2, 10]);
    });

    it('counts each level once, ordered by policy level order, even when policies disagree', () => {
        const result = summarizePredictionReviews(
            [alert(1, 1, 'Alert'), alert(2, 1), alert(3, 1, 'Alert', 2), alert(4, 1, 'Monitor', 2)],
            [prediction(1, '2026-01-01')],
            [policy(1, ['Monitor', 'Alert']), policy(2, ['Alert', 'Monitor'])],
        );
        expect(result[0].levelCounts).toEqual([{ level: 'Alert', count: 2 }, { level: 'Monitor', count: 2 }]);
    });
});
