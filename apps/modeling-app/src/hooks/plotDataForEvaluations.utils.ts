import {
    BackTestRead,
    createHighChartsData,
    DataElement,
    EvaluationEntry,
    EvaluationEntryExtend,
    EvaluationForSplitPoint,
    EvaluationPerOrgUnit,
    HighChartsData,
    joinRealAndPredictedData,
    normalizeEvaluationModelsToSharedPeriods,
    PERIOD_TYPES,
    sortPeriods,
} from '@dhis2-chap/ui';

const Y_AXIS_HEADROOM_MULTIPLIER = 1.05;

export type PlotDataResult = {
    evaluationEntries: EvaluationEntryExtend[];
    actualCases: DataElement[];
    splitPeriods: string[];
    evaluation: BackTestRead;
};

const getNumericMax = (values: Array<number | null | undefined>): number | undefined => {
    const numericValues = values.filter(
        (value): value is number =>
            value !== null &&
            value !== undefined &&
            Number.isFinite(value),
    );

    if (numericValues.length === 0) {
        return undefined;
    }

    return Math.max(...numericValues);
};

const getModelMaxY = (data: HighChartsData): number | undefined => {
    return getNumericMax([
        ...data.realValues ?? [],
        ...data.averages.map(point => point?.[0]),
        ...data.ranges.map(point => point?.[1]),
        ...(data.midranges?.map(point => point?.[1]) ?? []),
    ]);
};

const getOrgUnitMaxY = (
    evaluationPerOrgUnit: EvaluationPerOrgUnit[],
): number | undefined => {
    const rawMax = getNumericMax(
        evaluationPerOrgUnit.flatMap(row =>
            row.models.map(model => getModelMaxY(model.data)),
        ),
    );

    if (rawMax === undefined) {
        return undefined;
    }

    return rawMax * Y_AXIS_HEADROOM_MULTIPLIER;
};

export const getStableMaxYByOrgUnitId = (
    viewData: EvaluationForSplitPoint[],
): Record<string, number> => {
    const orgUnitRowsById = new Map<string, EvaluationPerOrgUnit[]>();

    viewData.forEach((splitPoint) => {
        splitPoint.evaluation.forEach((evaluationPerOrgUnit) => {
            const existingRows =
                orgUnitRowsById.get(evaluationPerOrgUnit.orgUnitId) ?? [];
            existingRows.push(evaluationPerOrgUnit);
            orgUnitRowsById.set(evaluationPerOrgUnit.orgUnitId, existingRows);
        });
    });

    return Array.from(orgUnitRowsById.entries()).reduce<Record<string, number>>(
        (accumulator, [orgUnitId, orgUnitRows]) => {
            const maxY = getOrgUnitMaxY(orgUnitRows);

            if (maxY !== undefined) {
                accumulator[orgUnitId] = maxY;
            }

            return accumulator;
        },
        {},
    );
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
