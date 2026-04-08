import {
    ApiError,
    BackTestRead,
    BacktestsService,
    DataList,
    EvaluationEntry,
    getSplitPeriod,
    plotResultsToViewData,
    PlotDataResult,
} from '@dhis2-chap/ui';
import { useCallback, useMemo } from 'react';
import {
    Query,
    useQueries,
    useQueryClient,
    UseQueryOptions,
} from '@tanstack/react-query';

const quantiles = [0.1, 0.25, 0.5, 0.75, 0.9];

type PlotDataRequestResult = {
    data: [EvaluationEntry[], DataList];
    evaluation: BackTestRead;
};

const select = (data: PlotDataRequestResult) => {
    const [evaluationEntries, actualCases] = data.data;
    const splitPeriods = getSplitPeriod(evaluationEntries);

    return {
        evaluationEntries: evaluationEntries.map(e => ({
            ...e,
            modelName: data.evaluation.name || undefined,
        })),
        actualCases: actualCases.data,
        splitPeriods,
        evaluation: data.evaluation,
    };
};
const isPlotData = (data: any): data is PlotDataRequestResult => {
    return (
        data &&
        data.evaluation &&
        Array.isArray(data.data) &&
        data.data.length === 2
    );
};

const isPlotDataQuery = (
    query: Query<any>,
): query is Query<PlotDataRequestResult> => {
    return !!query.state.data && isPlotData(query.state.data);
};

type PlotDataQueryKey = Readonly<
    ['evaluation-entry', number, { splitPeriod?: string; orgUnits?: string[] }]
>;

type UsePlotDataForEvaluationsOptions = {
    splitPeriod?: string;
    orgUnits?: string[];
};
const defaultOptions = {
    splitPeriod: undefined,
    orgUnits: undefined,
};
export const usePlotDataForEvaluations = (
    evaluations: BackTestRead[],
    { orgUnits, splitPeriod }: UsePlotDataForEvaluationsOptions = defaultOptions,
) => {
    const queryClient = useQueryClient();
    const sortedUnits = useMemo(() => {
        return orgUnits ? [...orgUnits].sort() : [];
    }, [orgUnits]);

    const getQueryKey = (
        evaluationId: number,
        { includeOrgunits } = { includeOrgunits: true },
    ) =>
        [
            'evaluation-entry',
            evaluationId,
            {
                splitPeriod,
                ...(includeOrgunits && { orgUnits: sortedUnits }),
            },
        ] as const;

    /* Try to find a query in the cache that has data for all selected orgunits */
    const getInitialData = useCallback(
        (evaluationId: number): PlotDataRequestResult | undefined => {
            if (!orgUnits || orgUnits.length === 0) {
                return undefined;
            }
            const idsSet = new Set(orgUnits);
            const plotQueryKey = getQueryKey(evaluationId, {
                includeOrgunits: false,
            });

            const plotQueryWithAllUnits = queryClient
                .getQueryCache()
                .find({
                    queryKey: plotQueryKey,
                    exact: false,
                    predicate: (query) => {
                        const queryKeyOrgUnits = (
                            query.queryKey as PlotDataQueryKey
                        )[2]?.orgUnits;
                        if (isPlotDataQuery(query) && queryKeyOrgUnits) {
                            const cachedOrgUnitsSet = new Set(queryKeyOrgUnits);
                            const queryHasAllUnits = orgUnits.every(ou =>
                                cachedOrgUnitsSet.has(ou),
                            );
                            return queryHasAllUnits;
                        }
                        return false;
                    },
                });

            if (plotQueryWithAllUnits) {
                const cachedData = plotQueryWithAllUnits.state
                    .data as PlotDataRequestResult;

                const evaluations = cachedData.data[0].filter(e =>
                    idsSet.has(e.orgUnit),
                );
                return {
                    ...cachedData,
                    data: [evaluations, cachedData.data[1]] as const,
                };
            }
            return undefined;
        },
        [splitPeriod, orgUnits, queryClient],
    );

    const evaluationQueries = useQueries({
        queries: evaluations.map(
            evaluation =>
                ({
                    queryKey: getQueryKey(evaluation.id),
                    queryFn: async () => {
                        const evaluationEntries =
                            BacktestsService.getEvaluationEntriesV1AnalyticsEvaluationEntryGet(
                                evaluation.id,
                                quantiles,
                                splitPeriod,

                                orgUnits,
                            );
                        const actualCases =
                            BacktestsService.getActualCasesV1AnalyticsActualCasesBacktestIdGet(
                                evaluation.id,
                                orgUnits,
                            );
                        const data = await Promise.all([
                            evaluationEntries,
                            actualCases,
                        ]);
                        return {
                            data,
                            evaluation: evaluation,
                        };
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
                >),
        ),
    });

    const evaluationKey = evaluations
        .map(evaluation => `${evaluation.id}:${evaluation.name ?? ''}`)
        .join('|');
    const orgUnitsKey = sortedUnits.join('|');
    const queryDataKey = evaluationQueries
        .map((query, index) =>
            `${evaluations[index]?.id ?? index}:${query.dataUpdatedAt}`,
        )
        .join('|');

    const combined = useMemo(() => {
        const allData = evaluationQueries.flatMap(q => q.data || []);
        const splitPeriods = evaluationQueries.flatMap(
            q => q.data?.splitPeriods || [],
        );
        const viewData = plotResultsToViewData(allData);

        return { viewData, splitPeriods };
    }, [evaluationKey, orgUnitsKey, splitPeriod, queryDataKey]);

    const isLoading = evaluationQueries.some(q => q.isLoading && q.isFetching);

    const error =
        (evaluationQueries.find(q => q.isError)?.error as ApiError)
        || undefined;

    return { queries: evaluationQueries, combined, isLoading, error };
};
