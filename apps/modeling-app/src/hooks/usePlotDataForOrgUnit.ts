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
} from '@dhis2-chap/ui';
import { useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

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

type PlotDataResult = {
    evaluationEntries: EvaluationEntryExtend[];
    actualCases: DataElement[];
    splitPeriods: string[];
    evaluation: BackTestRead;
};

const plotResultToViewData = (
    data: PlotDataResult,
    orgUnitId: string,
): EvaluationForSplitPoint[] => {
    const evaluationData = data.evaluationEntries;

    const allSplitPeriods = Array.from(
        new Set(evaluationData.map(item => item.splitPeriod)),
    );

    const createQuantileFunc = (quantiles: number[]) => {
        const lowQuantile = quantiles[0];
        const midLowQuantile = quantiles[1];
        const midHighQuantile = quantiles[quantiles.length - 2];
        const highQuantile = quantiles[quantiles.length - 1];

        return (item: EvaluationEntry) => {
            if (item.quantile === lowQuantile) {
                return 'quantile_low';
            } else if (item.quantile === highQuantile) {
                return 'quantile_high';
            } else if (item.quantile === 0.5) {
                return 'median';
            } else if (item.quantile === midLowQuantile) {
                return 'quantile_mid_low';
            } else if (item.quantile === midHighQuantile) {
                return 'quantile_mid_high';
            } else {
                return 'unknown';
            }
        };
    };

    return allSplitPeriods.map((splitPeriod: string) => {
        return {
            splitPoint: splitPeriod,
            evaluation: [
                {
                    orgUnitName: orgUnitId,
                    orgUnitId: orgUnitId,
                    models: [
                        {
                            modelName:
                                data.evaluation.name
                                || data.evaluation.modelId,
                            data: (() => {
                                const evaluationEntries =
                                    data.evaluationEntries.filter(
                                        entry =>
                                            entry.orgUnit === orgUnitId &&
                                            entry.splitPeriod === splitPeriod,
                                    );
                                const actualCasesForOrgunit =
                                    data.actualCases.filter(
                                        item => item.ou === orgUnitId,
                                    );
                                const quantiles = evaluationEntries.map(
                                    item => item.quantile,
                                );

                                const highChartData = createHighChartsData(
                                    evaluationEntries,
                                    createQuantileFunc(quantiles),
                                );
                                const joinedRealAndPredictedData: HighChartsData =
                                    joinRealAndPredictedData(
                                        highChartData,
                                        actualCasesForOrgunit,
                                    );
                                return joinedRealAndPredictedData;
                            })(),
                        },
                    ],
                },
            ],
        };
    });
};

/**
 * Hook to fetch plot data for a single organization unit with all split points.
 * This is more efficient than fetching data for all org units when only one is needed.
 */
export const usePlotDataForOrgUnit = (
    backtest: BackTestRead,
    orgUnitId: string | undefined,
) => {
    const queryOptions: UseQueryOptions<
        PlotDataRequestResult,
        Error | ApiError,
        PlotDataResult | undefined
    > = {
        queryKey: ['evaluation-entry-single-orgunit', backtest.id, orgUnitId],
        queryFn: async () => {
            if (!orgUnitId) {
                throw new Error('orgUnitId is required');
            }
            const evaluationEntries =
                await AnalyticsService.getEvaluationEntriesAnalyticsEvaluationEntryGet(
                    backtest.id,
                    quantiles,
                    undefined, // splitPeriod - we want all split periods
                    [orgUnitId], // only fetch data for the selected org unit
                );
            const actualCases =
                await AnalyticsService.getActualCasesAnalyticsActualCasesBacktestIdGet(
                    backtest.id,
                    [orgUnitId], // only fetch data for the selected org unit
                );
            const data: [EvaluationEntry[], DataList] = [evaluationEntries, actualCases];
            return {
                data,
                evaluation: backtest,
            };
        },
        select: select,
        enabled: !!backtest && !!orgUnitId,
        staleTime: 300000, // 5 minutes
        cacheTime: 300000, // 5 minutes
        retry: 0,
    };

    const {
        data,
        isLoading,
        error,
    } = useQuery(queryOptions);

    const viewData = useMemo(() => {
        if (!data || !orgUnitId) {
            return [];
        }
        return plotResultToViewData(data, orgUnitId);
    }, [data, orgUnitId]);

    return { viewData, isLoading, error: error as ApiError | undefined };
};
