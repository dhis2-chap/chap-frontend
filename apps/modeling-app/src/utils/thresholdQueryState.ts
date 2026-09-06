import type { QueryObserverResult } from '@tanstack/react-query';

type ThresholdQueryResult = Pick<
    QueryObserverResult,
    'data' | 'isSuccess' | 'isPreviousData' | 'fetchStatus'
>;

export const getThresholdQueryState = (enabled: boolean, query: ThresholdQueryResult) => ({
    // A query that is not enabled has nothing pending, so consumers are not
    // blocked on it (there are simply no thresholds). Once enabled, previous
    // data can still be drawn, but must never be imported as the result of
    // the newly selected parameters. A paused request is pending too.
    isReady: !enabled || (
        query.isSuccess && query.data !== undefined &&
        !query.isPreviousData && query.fetchStatus === 'idle'
    ),
    isLoading: enabled && query.fetchStatus !== 'idle',
    isPaused: enabled && query.fetchStatus === 'paused',
});
