import {
    createHighChartsData,
    createQuantileFunc,
    EvaluationForSplitPoint,
    HighChartsData,
    joinRealAndPredictedData,
    PlotDataResult,
} from '@dhis2-chap/ui';
import { PERIOD_TYPES, sortPeriods } from '@dhis2-chap/core';

/**
 * Reshapes evaluation entries for a single org unit into per-split-period
 * view data: predicted quantiles joined with actual cases for Highcharts.
 */
export const plotResultToViewData = (
    data: PlotDataResult,
    orgUnitId: string,
): EvaluationForSplitPoint[] => {
    const periodType = data.evaluation?.dataset?.periodType;

    const uniqueSplitPeriods = Array.from(
        new Set(data.evaluationEntries.map(item => item.splitPeriod)),
    );

    const allSplitPeriods = periodType
        ? sortPeriods(uniqueSplitPeriods, periodType as keyof typeof PERIOD_TYPES)
        : uniqueSplitPeriods;

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
                                const quantiles = Array.from(
                                    new Set(
                                        evaluationEntries.map(
                                            item => item.quantile,
                                        ),
                                    ),
                                ).sort((a, b) => a - b);

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
