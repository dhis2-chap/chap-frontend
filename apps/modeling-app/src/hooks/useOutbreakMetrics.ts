import { useQuery } from '@tanstack/react-query';
import { MetricsService, OpenAPI, type ApiError, type DataDimension, type OutbreakMetricsResponse } from '@dhis2-chap/ui';

// One cache entry per grouping, shared by the evaluation page and the signal review.
export const useOutbreakMetrics = (
    backtestId: number | null | undefined,
    policyId: number | undefined,
    groupBy: DataDimension | undefined,
    enabled: boolean,
) => (
    useQuery<OutbreakMetricsResponse, ApiError>({
        queryKey: ['outbreak-metrics', OpenAPI.BASE, backtestId, policyId, groupBy ?? null],
        queryFn: () => MetricsService.getOutbreakMetricsV1AnalyticsBacktestsBacktestIdOutbreakMetricsGet(
            backtestId!, policyId!,
            groupBy && [groupBy],
        ),
        enabled: enabled && backtestId != null && policyId != null,
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    })
);
