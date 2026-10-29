import { useQuery } from '@tanstack/react-query';
import { ApiError, BacktestsService, BacktestSpecificationRead } from '@dhis2-chap/ui';

export const isValidSpecificationId = (id: number) => Number.isInteger(id) && id > 0;

export const useBacktestSpecification = (id: number, includeArchivedModels = false, includeComparisonModels = false) => useQuery<BacktestSpecificationRead, ApiError>({
    queryKey: ['backtest-specifications', id, includeArchivedModels, includeComparisonModels],
    queryFn: () => BacktestsService.getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet(id, includeComparisonModels, includeArchivedModels),
    enabled: isValidSpecificationId(id),
    // Chap Core queues missing baselines after the first read, outside the jobs the app already polls.
    refetchInterval: data => data?.baselines?.some(baseline => baseline.status === 'pending') ? 10_000 : false,
    keepPreviousData: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
});
