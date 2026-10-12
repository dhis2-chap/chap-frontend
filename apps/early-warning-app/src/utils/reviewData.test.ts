import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead, AlertRead, PredictionInfo } from '@dhis2-chap/ui';
import { estimateExceedance, normalizeAlertPeriod, summarizePredictionReviews } from './reviewData';

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

describe('estimated exceedance', () => {
    const quantiles = { quantile_low: 10, median: 50, quantile_high: 90 };
    it('interpolates between quantiles and reports bounds outside them', () => {
        expect(estimateExceedance(quantiles, 30)?.probability).toBeCloseTo(0.7);
        expect(estimateExceedance(quantiles, 9)).toEqual({ probability: 0.9, bound: 'above' });
        expect(estimateExceedance(quantiles, 100)?.bound).toBe('below');
    });
    it('handles flat quantiles without division by zero and rejects inconsistent values', () => {
        expect(estimateExceedance({ quantile_low: 10, median: 10, quantile_high: 20 }, 10)?.probability).toBeCloseTo(0.5);
        expect(estimateExceedance({ median: 50, quantile_high: 20 }, 30)).toBeUndefined();
        expect(estimateExceedance({}, 30)).toBeUndefined();
    });
});

describe('alert period matching', () => {
    it('matches CHAP months/weeks to DHIS2 periods without changing already normalized ids', () => {
        expect(normalizeAlertPeriod('2024-07')).toBe('202407');
        expect(normalizeAlertPeriod('2024-W02')).toBe('2024W2');
        expect(normalizeAlertPeriod('2024W02')).toBe('2024W2');
        expect(normalizeAlertPeriod('202407')).toBe('202407');
    });
});
