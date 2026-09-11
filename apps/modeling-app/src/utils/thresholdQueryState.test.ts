import { describe, expect, it } from 'vitest';
import { getThresholdQueryState } from './thresholdQueryState';

const freshResult = {
    data: { entries: [] },
    isSuccess: true,
    isPreviousData: false,
    fetchStatus: 'idle',
} as const;

describe('getThresholdQueryState', () => {
    it('is ready once a fresh calculation has settled', () => {
        expect(getThresholdQueryState(true, freshResult)).toEqual({
            isReady: true, isLoading: false, isPaused: false,
        });
    });

    it('keeps previous thresholds drawable but not importable while recalculating', () => {
        // With keepPreviousData, React Query reports the previous result as a
        // success, so isSuccess alone would let the import consume stale data.
        expect(getThresholdQueryState(true, {
            ...freshResult, isPreviousData: true, fetchStatus: 'fetching',
        })).toEqual({ isReady: false, isLoading: true, isPaused: false });
    });

    it('treats a request paused while offline as still pending', () => {
        // A paused request is not fetching either; only fetchStatus reveals it.
        expect(getThresholdQueryState(true, {
            ...freshResult, isPreviousData: true, fetchStatus: 'paused',
        })).toEqual({ isReady: false, isLoading: true, isPaused: true });
    });

    it('is not ready after a failed calculation', () => {
        expect(getThresholdQueryState(true, {
            data: undefined, isSuccess: false, isPreviousData: false, fetchStatus: 'idle',
        })).toEqual({ isReady: false, isLoading: false, isPaused: false });
    });

    it('has nothing pending while the query is not enabled', () => {
        expect(getThresholdQueryState(false, {
            data: undefined, isSuccess: false, isPreviousData: false, fetchStatus: 'idle',
        })).toEqual({ isReady: true, isLoading: false, isPaused: false });
    });
});
