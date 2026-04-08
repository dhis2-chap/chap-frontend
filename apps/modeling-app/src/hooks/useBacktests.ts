import { useQuery } from '@tanstack/react-query';
import { ApiError, BackTestRead, BacktestsService } from '@dhis2-chap/ui';

export const BACKTESTS_LIST_QUERY_KEY = 'backtests' as const;

export const useBacktests = () => {
    const { data, error, isLoading } = useQuery<BackTestRead[], ApiError>({
        queryKey: [BACKTESTS_LIST_QUERY_KEY],
        queryFn: () => BacktestsService.getBacktestsV1CrudBacktestsGet(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    return {
        backtests: data,
        error,
        isLoading,
    };
};
