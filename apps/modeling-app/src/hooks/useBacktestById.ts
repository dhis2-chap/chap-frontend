import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, BackTestRead, CrudService } from '@dhis2-chap/ui';
import { BACKTESTS_LIST_QUERY_KEY } from './useBacktests';

export const useBacktestById = (backtestId?: number) => {
    const queryClient = useQueryClient();

    const { data, error, isLoading, isFetching } = useQuery<
        BackTestRead,
        ApiError
    >({
        queryKey: [BACKTESTS_LIST_QUERY_KEY, backtestId],
        queryFn: () =>
            CrudService.getBacktestInfoCrudBacktestsBacktestIdInfoGet(
                backtestId!,
            ),
        initialData: () => {
            const cachedList = queryClient.getQueryData<BackTestRead[]>([
                BACKTESTS_LIST_QUERY_KEY,
            ]);
            return cachedList?.find(backtest => backtest.id === backtestId);
        },
        enabled: !!backtestId && typeof backtestId === 'number',
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        backtest: data,
        error,
        isLoading,
        isFetching,
    };
};
