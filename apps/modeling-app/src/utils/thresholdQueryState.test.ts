import { onlineManager, QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { getThresholdQueryState } from './thresholdQueryState';

describe('threshold query readiness', () => {
    it('keeps previous thresholds unavailable for import while offline and until the new calculation finishes', async () => {
        const client = new QueryClient();
        client.mount();
        const previous = { strategy: 'seasonal', threshold: 10 };
        const next = { strategy: 'percentile', threshold: 20 };
        client.setQueryData(['thresholds', 'seasonal'], previous);
        const observer = new QueryObserver(client, {
            queryKey: ['thresholds', 'seasonal'],
            queryFn: async () => previous,
            staleTime: Infinity,
            keepPreviousData: true,
        });
        const unsubscribe = observer.subscribe(() => {});
        let finishCalculation!: (result: typeof next) => void;
        const calculate = vi.fn(() => new Promise<typeof next>((resolve) => {
            finishCalculation = resolve;
        }));

        try {
            expect(getThresholdQueryState(true, observer.getCurrentResult()).isReady).toBe(true);
            onlineManager.setOnline(false);
            observer.setOptions({
                queryKey: ['thresholds', 'percentile'],
                queryFn: calculate,
                staleTime: Infinity,
                keepPreviousData: true,
            });

            const paused = observer.getCurrentResult();
            expect(paused.data).toEqual(previous);
            // React Query reports success without fetching here: neither flag
            // alone protects the import from consuming the seasonal result.
            expect(paused.isSuccess).toBe(true);
            expect(paused.isFetching).toBe(false);
            expect(getThresholdQueryState(true, paused)).toEqual({
                isReady: false, isLoading: true, isPaused: true,
            });

            onlineManager.setOnline(true);
            await vi.waitFor(() => expect(calculate).toHaveBeenCalledOnce());
            expect(observer.getCurrentResult().data).toEqual(previous);
            expect(getThresholdQueryState(true, observer.getCurrentResult())).toEqual({
                isReady: false, isLoading: true, isPaused: false,
            });

            finishCalculation(next);
            await vi.waitFor(() => expect(observer.getCurrentResult().data).toEqual(next));
            expect(getThresholdQueryState(true, observer.getCurrentResult())).toEqual({
                isReady: true, isLoading: false, isPaused: false,
            });
            expect(getThresholdQueryState(false, observer.getCurrentResult()).isReady).toBe(false);
        } finally {
            unsubscribe();
            client.unmount();
            client.clear();
            onlineManager.setOnline(true);
        }
    });

    it('does not expose a failed new calculation as ready', async () => {
        const loggedError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const client = new QueryClient();
        const observer = new QueryObserver(client, {
            queryKey: ['thresholds', 'invalid-baseline'],
            queryFn: async () => { throw new Error('No observations in the baseline'); },
            retry: false,
        });
        const unsubscribe = observer.subscribe(() => {});
        try {
            await vi.waitFor(() => expect(observer.getCurrentResult().isError).toBe(true));
            expect(getThresholdQueryState(true, observer.getCurrentResult())).toEqual({
                isReady: false, isLoading: false, isPaused: false,
            });
        } finally {
            unsubscribe();
            client.clear();
            loggedError.mockRestore();
        }
    });
});
