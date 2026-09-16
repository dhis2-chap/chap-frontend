import {
    BacktestRead,
    BacktestsService,
    DataList,
    EvaluationEntry,
    getSplitPeriod,
} from '@dhis2-chap/ui';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { plotResultToViewData } from '../utils/evaluationPlotData';

const quantiles = [0.1, 0.25, 0.5, 0.75, 0.9];

type PlotDataRequestResult = {
    data: [EvaluationEntry[], DataList];
    evaluation: BacktestRead;
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

/**
 * Hook to fetch plot data for a single organization unit with all split points.
 **/
export const usePlotDataForEvaluationsByOrgUnit = (
    backtest: BacktestRead,
    orgUnitId: string | undefined,
) => {
    const queries = useQueries({
        queries: [
            {
                queryKey: ['evaluation-entries', backtest.id, orgUnitId],
                queryFn: async () => {
                    if (!orgUnitId) {
                        throw new Error('orgUnitId is required');
                    }
                    return await BacktestsService.getEvaluationEntriesV1AnalyticsEvaluationEntryGet(
                        backtest.id,
                        quantiles,
                        undefined,
                        [orgUnitId],
                    );
                },
                enabled: !!backtest && !!orgUnitId,
                staleTime: 5 * 60 * 1000, // 5 minutes
                cacheTime: 5 * 60 * 1000, // 5 minutes
                retry: 0,
            },
            {
                queryKey: ['actual-cases', backtest.id, orgUnitId],
                queryFn: async () => {
                    if (!orgUnitId) {
                        throw new Error('orgUnitId is required');
                    }
                    return await BacktestsService.getActualCasesV1AnalyticsActualCasesBacktestIdGet(
                        backtest.id,
                        [orgUnitId],
                    );
                },
                enabled: !!backtest && !!orgUnitId,
                staleTime: 5 * 60 * 1000, // 5 minutes
                cacheTime: 5 * 60 * 1000, // 5 minutes
                retry: 0,
            },
        ],
    });

    const [evaluationEntriesQuery, actualCasesQuery] = queries;

    const isLoading = evaluationEntriesQuery.isLoading || actualCasesQuery.isLoading;
    const error = evaluationEntriesQuery.error || actualCasesQuery.error;

    const data = useMemo(() => {
        if (!evaluationEntriesQuery.data || !actualCasesQuery.data) {
            return undefined;
        }

        const plotDataResult: PlotDataRequestResult = {
            data: [evaluationEntriesQuery.data, actualCasesQuery.data],
            evaluation: backtest,
        };

        return select(plotDataResult);
    }, [evaluationEntriesQuery.data, actualCasesQuery.data, backtest]);

    const viewData = useMemo(() => {
        if (!data || !orgUnitId) {
            return [];
        }
        return plotResultToViewData(data, orgUnitId);
    }, [data, orgUnitId]);

    return {
        viewData,
        isLoading,
        error,
    };
};
