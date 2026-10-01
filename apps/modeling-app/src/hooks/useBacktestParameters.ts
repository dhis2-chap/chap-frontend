import { ApiError, BacktestParameterInfo, BacktestsService } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';

export const useBacktestParameters = () => useQuery<BacktestParameterInfo[], ApiError>({
    queryKey: ['backtest-parameters'],
    queryFn: () => BacktestsService.listBacktestParametersV1AnalyticsBacktestParametersGet(),
    staleTime: Infinity,
    retry: false,
});
