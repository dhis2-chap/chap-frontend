import {
    AnalyticsService,
    ApiError,
    BackTestRead,
    createHighChartsData,
    DataElement,
    DataList,
    EvaluationEntry,
    EvaluationEntryExtend,
    EvaluationForSplitPoint,
    getSplitPeriod,
    HighChartsData,
    joinRealAndPredictedData,
} from '@dhis2-chap/chap-lib'
import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

const quantiles = [0.1, 0.25, 0.5, 0.75, 0.9]

const select = (data: {
    data: [EvaluationEntry[], DataList]
    evaluation: BackTestRead
}) => {
    const [evaluationEntries, actualCases] = data.data
    const splitPeriods = getSplitPeriod(evaluationEntries)

    return {
        evaluationEntries: evaluationEntries.map((e) => ({
            ...e,
            modelName: data.evaluation.name || undefined,
        })),
        actualCases: actualCases.data,
        splitPeriods,
        evaluation: data.evaluation,
    }
}

type UsePlotDataForEvaluationsOptions = {
    splitPeriod?: string
    orgUnits?: string[]
}
const defaultOptions = {
    splitPeriod: undefined,
    orgUnits: undefined,
}
export const usePlotDataForEvaluations = (
    evaluations: BackTestRead[],
    { orgUnits, splitPeriod }: UsePlotDataForEvaluationsOptions = defaultOptions
) => {
    const evaluationQueries = useQueries({
        queries: evaluations.map((evaluation) => ({
            queryKey: [
                'evaluation-entry',
                evaluation.id,
                { splitPeriod, orgUnits: orgUnits?.sort() },
            ],
            queryFn: async () => {
                const evaluationEntries =
                    AnalyticsService.getEvaluationEntriesAnalyticsEvaluationEntryGet(
                        evaluation.id,
                        quantiles,
                        splitPeriod,
                        orgUnits
                    )
                const actualCases =
                    AnalyticsService.getActualCasesAnalyticsActualCasesBacktestIdGet(
                        evaluation.id,
                        orgUnits
                    )
                const data = await Promise.all([evaluationEntries, actualCases])
                return {
                    data,
                    evaluation: evaluation,
                }
            },
            select: select,
            enabled: !!evaluation && (!!orgUnits ? orgUnits.length > 0 : true),
            staleTime: 60 * 1000,
        })),
    })

    const combined = useMemo(() => {
        const allData = evaluationQueries.flatMap((q) => q.data || [])
        const splitPeriods = evaluationQueries.flatMap(
            (q) => q.data?.splitPeriods || []
        )
        const viewData = plotResultToViewData(allData)

        return { viewData, splitPeriods }
    }, [evaluationQueries])

    const isLoading = evaluationQueries.some((q) => q.isLoading && q.isFetching)
    const error =
        (evaluationQueries.find((q) => q.isError)?.error as ApiError) ||
        undefined

    return { queries: evaluationQueries, combined, isLoading, error }
}

type PlotDataResult = {
    evaluationEntries: EvaluationEntryExtend[]
    actualCases: DataElement[]
    splitPeriods: string[]
    evaluation: BackTestRead
}

const plotResultToViewData = (
    data: PlotDataResult[]
): EvaluationForSplitPoint[] => {
    const evaluationData = data.flatMap((d) => d.evaluationEntries)

    const allSplitPeriods = Array.from(
        new Set(evaluationData.map((item) => item.splitPeriod))
    )
    const allOrgunits = Array.from(
        new Set(evaluationData.map((item) => item.orgUnit))
    )

    const createQuantileFunc = (quantiles: number[]) => {
        const lowQuantile = quantiles[0]
        const midLowQuantile = quantiles[1]
        const midHighQuantile = quantiles[quantiles.length - 2]
        const highQuantile = quantiles[quantiles.length - 1]

        return (item: EvaluationEntry) => {
            if (item.quantile === lowQuantile) {
                return 'quantile_low'
            } else if (item.quantile === highQuantile) {
                return 'quantile_high'
            } else if (item.quantile === 0.5) {
                return 'median'
            } else if (item.quantile === midLowQuantile) {
                return 'quantile_mid_low'
            } else if (item.quantile === midHighQuantile) {
                return 'quantile_mid_high'
            } else {
                return 'unknown'
            }
        }
    }
    //loop trough each unique split period (each row / line of plots)
    return allSplitPeriods.map((splitPeriod: string) => {
        return {
            splitPoint: splitPeriod,
            evaluation: allOrgunits.map((orgUnit: string) => {
                return {
                    orgUnitName: orgUnit,
                    orgUnitId: orgUnit,
                    models: data.map((dataForEvaluation) => {
                        const evaluationEntries =
                            dataForEvaluation.evaluationEntries.filter(
                                (entry) =>
                                    entry.orgUnit === orgUnit &&
                                    entry.splitPeriod === splitPeriod
                            )
                        const actualCasesForOrgunit =
                            dataForEvaluation.actualCases.filter(
                                (item) => item.ou === orgUnit
                            )
                        const quantiles = evaluationEntries.map(
                            (item) => item.quantile
                        )
                        
                        const highChartData = createHighChartsData(
                            evaluationEntries,
                            createQuantileFunc(quantiles)
                        )
                        const joinedRealAndPredictedData: HighChartsData =
                            joinRealAndPredictedData(
                                highChartData,
                                actualCasesForOrgunit
                            )
                        return {
                            // this conforms to old API where modelName is shown, however we actually want to use the evaluation name...
                            modelName:
                                dataForEvaluation.evaluation.name ||
                                dataForEvaluation.evaluation.modelId,
                            data: joinedRealAndPredictedData,
                        }
                    }),
                }
            }),
        }
    })
}
