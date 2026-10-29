import { useQueries } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { BacktestsService, type BacktestRead } from '@dhis2-chap/ui';
import { referenceName } from '@/components/ModelComparisons/referenceModels';
import { useBacktestSpecification } from '@/pages/BenchmarksPage/useBacktestSpecification';
import { BACKTESTS_LIST_QUERY_KEY } from './useBacktests';

export const useBaselineBacktests = (specificationId?: number) => {
    const specification = useBacktestSpecification(specificationId ?? 0);
    // The specification hook keeps previous data while a different evaluation loads.
    const isCurrent = !!specificationId && !specification.isPreviousData;
    const baselines = isCurrent ? specification.data?.baselines ?? [] : [];
    const queries = useQueries({
        queries: baselines
            .filter(baseline => baseline.status === 'done' && baseline.backtestId != null)
            .map(baseline => ({
                queryKey: [BACKTESTS_LIST_QUERY_KEY, baseline.backtestId],
                queryFn: () => BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet(baseline.backtestId!),
                select: (backtest: BacktestRead) => ({
                    ...backtest,
                    name: i18n.t('{{name}} (baseline)', { name: referenceName(baseline) }),
                }),
                staleTime: 5 * 60 * 1000,
                cacheTime: 5 * 60 * 1000,
                retry: 0,
            })),
    });

    return {
        backtests: queries.flatMap(query => query.data ? [query.data] : []),
        isLoading: !!specificationId && (!isCurrent || specification.isInitialLoading || queries.some(query => query.isLoading)),
        isSuccess: !specificationId || (isCurrent && specification.isSuccess && queries.every(query => query.isSuccess)),
        error: specification.error || queries.find(query => query.error)?.error,
    };
};
