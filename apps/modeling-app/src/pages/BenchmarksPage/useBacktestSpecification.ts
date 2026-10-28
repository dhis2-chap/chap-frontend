import { useQuery } from '@tanstack/react-query';
import { ApiError, BacktestsService, BacktestSpecificationRead } from '@dhis2-chap/ui';

export const isValidSpecificationId = (id: number) => Number.isInteger(id) && id > 0;

export const useBacktestSpecification = (id: number, includeArchivedModels = false) => useQuery<BacktestSpecificationRead, ApiError>({
    queryKey: ['backtest-specifications', id, includeArchivedModels],
    queryFn: () => BacktestsService.getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet(id, false, includeArchivedModels),
    enabled: isValidSpecificationId(id),
    keepPreviousData: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
});
