import { describe, it, expect } from 'vitest';
import type { LocalExplanationResponse } from '@dhis2-chap/ui';
import { pickLatestExplanation } from './useLocalExplanation';

const mk = (overrides: Partial<LocalExplanationResponse>): LocalExplanationResponse => ({
    predictionId: 1,
    orgUnit: 'orgA',
    period: '202401',
    method: 'shap',
    outputStatistic: 'mean',
    featureAttributions: [],
    baselinePrediction: 0,
    actualPrediction: 0,
    status: 'success',
    ...overrides,
});

describe('pickLatestExplanation', () => {
    it('returns undefined for an empty array', () => {
        expect(pickLatestExplanation([])).toBeUndefined();
    });

    it('returns the only row when there is exactly one', () => {
        const only = mk({ id: 1 });
        expect(pickLatestExplanation([only])).toBe(only);
    });

    it('picks the row with the highest id', () => {
        const a = mk({ id: 1 });
        const b = mk({ id: 5 });
        const c = mk({ id: 3 });
        expect(pickLatestExplanation([a, b, c])).toBe(b);
    });

    it('breaks id ties using computedAt (latest wins)', () => {
        const earlier = mk({ id: 2, computedAt: '2024-01-01T00:00:00Z' });
        const later = mk({ id: 2, computedAt: '2024-06-01T00:00:00Z' });
        expect(pickLatestExplanation([earlier, later])).toBe(later);
        expect(pickLatestExplanation([later, earlier])).toBe(later);
    });

    it('treats missing id as -1 so any defined id wins', () => {
        const noId = mk({ id: undefined });
        const withId = mk({ id: 0 });
        expect(pickLatestExplanation([noId, withId])).toBe(withId);
    });

    it('treats missing computedAt as the empty string when ids tie', () => {
        const noTime = mk({ id: 1 });
        const withTime = mk({ id: 1, computedAt: '2024-01-01T00:00:00Z' });
        expect(pickLatestExplanation([noTime, withTime])).toBe(withTime);
    });
});
