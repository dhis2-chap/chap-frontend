import { useQuery } from '@tanstack/react-query';
import { ApiError, BacktestsService, BacktestSpecificationRead } from '@dhis2-chap/ui';

export const isValidSpecificationId = (id: number) => Number.isInteger(id) && id > 0;

export const useBacktestSpecification = (id: number) => useQuery<BacktestSpecificationRead, ApiError>({
    queryKey: ['backtest-specifications', id],
    queryFn: () => BacktestsService.getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet(id),
    enabled: isValidSpecificationId(id),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
});
