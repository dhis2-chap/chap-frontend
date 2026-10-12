import { describe, expect, it } from 'vitest';
import type { AlertRead, PredictionInfo } from '@dhis2-chap/ui';
import { summarizePredictionReviews } from './reviewData';

const prediction = (id: number, created: string) => ({ id, created }) as PredictionInfo;
const alert = (id: number, predictionId: number, approved: string, level = 'Warning') => (
    { id, predictionId, approved, level } as AlertRead
);

describe('prediction review queue', () => {
    it('sorts by creation time rather than prediction id and excludes predictions without alerts', () => {
        const result = summarizePredictionReviews([
            alert(1, 10, 'pending'), alert(2, 2, 'pending'),
        ], [prediction(10, '2026-01-01'), prediction(2, '2026-02-01'), prediction(3, '2026-03-01')]);
        expect(result.map(review => review.prediction.id)).toEqual([2, 10]);
    });

    it('keeps partially reviewed runs pending and summarizes only outstanding levels', () => {
        const result = summarizePredictionReviews([
            alert(1, 1, 'pending'), alert(2, 1, 'approved', 'Alarm'),
            { ...alert(3, 1, 'declined'), approvedBy: 'reviewer', approvedAt: '2026-01-04' },
            alert(4, 1, 'pending'),
        ], [prediction(1, '2026-01-01')]);
        expect(result[0]).toMatchObject({
            pending: 2, accepted: 1, declined: 1, pendingLevelCounts: { Warning: 2 },
            reviewers: ['reviewer'], lastReviewedAt: '2026-01-04',
        });
    });
});
