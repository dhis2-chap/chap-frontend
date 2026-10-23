import { describe, expect, it, vi } from 'vitest';
import type { AlertPolicyRead, AlertRead, PredictionInfo } from '@dhis2-chap/ui';
import { sortAlertLevels } from '../../../../packages/ui/src/utils/sortAlertLevels';
import { normalizeAlertPeriod, summarizePredictionReviews } from './reviewData';

// The real barrel pulls in @dhis2/ui, which cannot load in the node test environment.
vi.mock('@dhis2-chap/ui', () => ({ sortAlertLevels }));

const prediction = (id: number, created: string) => ({ id, created }) as PredictionInfo;
const alert = (id: number, predictionId: number, level = 'Monitor', alertPolicyId = 1) => (
    { id, predictionId, level, alertPolicyId } as AlertRead
);
const policy = (id: number, levels: [string, number][]) => ({
    id,
    levels: levels.map(([name, exceedanceThreshold]) => ({
        name, exceedanceThreshold, thresholdParams: { type: 'seasonal', stdMultiplier: 2 },
    })),
}) as AlertPolicyRead;

describe('prediction review queue', () => {
    it('sorts by creation time rather than prediction id and excludes predictions without pending alerts', () => {
        const result = summarizePredictionReviews(
            [alert(1, 10), alert(2, 2)],
            [prediction(10, '2026-01-01'), prediction(2, '2026-02-01'), prediction(3, '2026-03-01')],
            [policy(1, [['Monitor', 0.5], ['Alert', 0.75]])],
        );
        expect(result.map(review => review.prediction.id)).toEqual([2, 10]);
    });

    it('counts each level once, least strict first, even when policies disagree', () => {
        const result = summarizePredictionReviews(
            [alert(1, 1, 'Alert'), alert(2, 1), alert(3, 1, 'Alert', 2), alert(4, 1, 'Monitor', 2)],
            [prediction(1, '2026-01-01')],
            [policy(1, [['Monitor', 0.5], ['Alert', 0.75]]), policy(2, [['Alert', 0.25], ['Monitor', 0.9]])],
        );
        expect(result[0].levelCounts).toEqual([
            { level: 'Alert', alertPolicyId: 1, count: 2 },
            { level: 'Monitor', alertPolicyId: 1, count: 2 },
        ]);
    });

    it('ranks levels by strictness rather than stored order', () => {
        const result = summarizePredictionReviews(
            [alert(1, 1, 'Intervention required'), alert(2, 1, 'Alert'), alert(3, 1)],
            [prediction(1, '2026-01-01')],
            [policy(1, [['Intervention required', 0.9], ['Monitor', 0.25], ['Alert', 0.75]])],
        );
        expect(result[0].levelCounts.map(({ level }) => level)).toEqual(['Monitor', 'Alert', 'Intervention required']);
    });
});

describe('alert period matching', () => {
    it('matches CHAP periods to DHIS2 periods without changing already normalized ids', () => {
        expect(normalizeAlertPeriod('2024-07')).toBe('202407');
        expect(normalizeAlertPeriod('2024-07-15')).toBe('20240715');
        expect(normalizeAlertPeriod('2024-W02')).toBe('2024W2');
        expect(normalizeAlertPeriod('2024-S02')).toBe('2024SunW2');
        expect(normalizeAlertPeriod('2024W02')).toBe('2024W2');
        expect(normalizeAlertPeriod('202407')).toBe('202407');
    });
});
