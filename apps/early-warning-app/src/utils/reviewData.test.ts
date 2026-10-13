import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead, AlertRead, PredictionInfo } from '@dhis2-chap/ui';
import { summarizePredictionReviews } from './reviewData';

const prediction = (id: number, created: string) => ({ id, created }) as PredictionInfo;
const alert = (id: number, predictionId: number, approved: string, level = 'Monitor') => (
    { id, predictionId, approved, level, alertPolicyId: 1 } as AlertRead
);
const policy = { id: 1, levels: [{ name: 'Monitor' }, { name: 'Alert' }] } as AlertPolicyRead;

describe('prediction review queue', () => {
    it('sorts by creation time rather than prediction id and excludes predictions without pending alerts', () => {
        const result = summarizePredictionReviews([
            alert(1, 10, 'pending'), alert(2, 2, 'pending'), alert(3, 3, 'approved'),
        ], [prediction(10, '2026-01-01'), prediction(2, '2026-02-01'), prediction(3, '2026-03-01')], [policy]);
        expect(result.map(review => review.prediction.id)).toEqual([2, 10]);
    });

    it('counts only pending alerts, ordered by the policy level order', () => {
        const result = summarizePredictionReviews([
            alert(1, 1, 'pending', 'Alert'), alert(2, 1, 'approved', 'Alert'),
            alert(3, 1, 'declined'), alert(4, 1, 'pending'), alert(5, 1, 'pending', 'Alert'),
        ], [prediction(1, '2026-01-01')], [policy]);
        expect(result[0].levelCounts).toEqual([{ level: 'Monitor', count: 1 }, { level: 'Alert', count: 2 }]);
    });
});
