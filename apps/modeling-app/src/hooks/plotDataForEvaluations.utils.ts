import {
    BackTestRead,
    createHighChartsData,
    DataElement,
    EvaluationEntry,
    EvaluationEntryExtend,
    EvaluationForSplitPoint,
    HighChartsData,
    joinRealAndPredictedData,
    normalizeEvaluationModelsToSharedPeriods,
    PERIOD_TYPES,
    sortPeriods,
} from '@dhis2-chap/ui';

export type PlotDataResult = {
    evaluationEntries: EvaluationEntryExtend[];
    actualCases: DataElement[];
    splitPeriods: string[];
    evaluation: BackTestRead;
};

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

export const plotResultsToViewData = (
    data: PlotDataResult[],
): EvaluationForSplitPoint[] => {
    const evaluationData = data.flatMap(d => d.evaluationEntries);
    const periodType = data[0]?.evaluation?.dataset?.periodType;

    const uniqueSplitPeriods = Array.from(
        new Set(evaluationData.map(item => item.splitPeriod)),
    );

    const allSplitPeriods = periodType
        ? sortPeriods(
                uniqueSplitPeriods,
                periodType as keyof typeof PERIOD_TYPES,
            )
        : uniqueSplitPeriods;

    const allOrgunits = Array.from(
        new Set(evaluationData.map(item => item.orgUnit)),
    );

    return allSplitPeriods.map((splitPeriod: string) => {
        return {
            splitPoint: splitPeriod,
            evaluation: allOrgunits.map((orgUnit: string) => {
                const models = data.map((dataForEvaluation) => {
                    const evaluationEntries =
                        dataForEvaluation.evaluationEntries.filter(
                            entry =>
                                entry.orgUnit === orgUnit &&
                                entry.splitPeriod === splitPeriod,
                        );
                    const actualCasesForOrgunit =
                        dataForEvaluation.actualCases.filter(
                            item => item.ou === orgUnit,
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

                    return {
                        modelName:
                            dataForEvaluation.evaluation.name || dataForEvaluation.evaluation.modelId,
                        data: joinedRealAndPredictedData,
                    };
                });

                return {
                    orgUnitName: orgUnit,
                    orgUnitId: orgUnit,
                    models: normalizeEvaluationModelsToSharedPeriods(
                        models,
                        periodType as keyof typeof PERIOD_TYPES | undefined,
                    ),
                };
            }),
        };
    });
};
