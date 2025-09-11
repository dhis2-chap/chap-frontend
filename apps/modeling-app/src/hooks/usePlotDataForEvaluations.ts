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
} from '@dhis2-chap/ui'
import { useCallback, useMemo } from 'react'
import {
    Query,
    useQueries,
    useQueryClient,
    UseQueryOptions,
} from '@tanstack/react-query'

const quantiles = [0.1, 0.25, 0.5, 0.75, 0.9]

type PlotDataRequestResult = {
    data: [EvaluationEntry[], DataList]
    evaluation: BackTestRead
}

const select = (data: PlotDataRequestResult) => {
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
const isPlotData = (data: any): data is PlotDataRequestResult => {
    return (
        data &&
        data.evaluation &&
        Array.isArray(data.data) &&
        data.data.length === 2
    )
}

const isPlotDataQuery = (
    query: Query<any>
): query is Query<PlotDataRequestResult> => {
    return !!query.state.data && isPlotData(query.state.data)
}

type PlotDataQueryKey = Readonly<
    ['evaluation-entry', number, { splitPeriod?: string; orgUnits?: string[] }]
>

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
    const queryClient = useQueryClient()
    const sortedUnits = useMemo(() => {
        return orgUnits ? orgUnits.sort() : []
    }, [orgUnits])

    const getQueryKey = (
        evaluationId: number,
        { includeOrgunits } = { includeOrgunits: true }
    ) =>
        [
            'evaluation-entry',
            evaluationId,
            {
                splitPeriod,
                ...(includeOrgunits && { orgUnits: sortedUnits }),
            },
        ] as const

    /* Try to find a query in the cache that has data for all selected orgunits */
    const getInitialData = useCallback(
        (evaluationId: number): PlotDataRequestResult | undefined => {
            if (!orgUnits || orgUnits.length === 0) {
                return undefined
            }
            const idsSet = new Set(orgUnits)
            const plotQueryKey = getQueryKey(evaluationId, {
                includeOrgunits: false,
            })

            const plotQueryWithAllUnits = queryClient
                .getQueryCache()
                .find(plotQueryKey, {
                    exact: false,
                    predicate: (query) => {
                        const queryKeyOrgUnits = (
                            query.queryKey as PlotDataQueryKey
                        )[2]?.orgUnits
                        if (isPlotDataQuery(query) && queryKeyOrgUnits) {
                            const cachedOrgUnitsSet = new Set(queryKeyOrgUnits)
                            const queryHasAllUnits = orgUnits.every((ou) =>
                                cachedOrgUnitsSet.has(ou)
                            )
                            return queryHasAllUnits
                        }
                        return false
                    },
                })

            if (plotQueryWithAllUnits) {
                const cachedData = plotQueryWithAllUnits.state
                    .data as PlotDataRequestResult

                const evaluations = cachedData.data[0].filter((e) =>
                    idsSet.has(e.orgUnit)
                )
                return {
                    ...cachedData,
                    data: [evaluations, cachedData.data[1]] as const,
                }
            }
            return undefined
        },
        [splitPeriod, orgUnits, queryClient]
    )

    const evaluationQueries = useQueries({
        queries: evaluations.map(
            (evaluation) =>
            ({
                queryKey: getQueryKey(evaluation.id),
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
                    const data = await Promise.all([
                        evaluationEntries,
                        actualCases,
                    ])
                    return {
                        data,
                        evaluation: evaluation,
                    }
                },
                initialData: getInitialData(evaluation.id),
                select: select,
                enabled:
                    !!evaluation && (!orgUnits || orgUnits.length > 0),
                staleTime: 60 * 1000,
            } satisfies UseQueryOptions<
                PlotDataRequestResult,
                Error | ApiError,
                PlotDataResult | undefined
            >)
        ),
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
