import { AnalyticsService, BacktestDomain } from '@dhis2-chap/ui'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

type UseBackTestOverlapOptions = {
    baseEvaluation?: number
    comparisonEvaluation?: number
}

/**
 * Gets the overlap (eg. common) of split periods and organisation units between two evaluations
 *
 */
export const useEvaluationOverlap = (options: UseBackTestOverlapOptions) => {
    const { baseEvaluation, comparisonEvaluation } = options
    return useQuery({
        queryKey: ['backtest-overlap', [baseEvaluation, comparisonEvaluation]],
        queryFn: () => {
            return AnalyticsService.getBacktestOverlapAnalyticsBacktestOverlapBacktestId1BacktestId2Get(
                baseEvaluation!,
                comparisonEvaluation!
            )
        },
        staleTime: 60 * 1000 * 5,
        enabled: !!baseEvaluation && !!comparisonEvaluation,
        select: useCallback(
            (data: BacktestDomain) => ({
                ...data,
                splitPeriods: data.splitPeriods.sort(),
            }),
            []
        ),
    })
}
