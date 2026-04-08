import { BackTestRead, DataElement, EvaluationEntry } from '../httpfunctions';
import {
    EvaluationEntryExtend,
    EvaluationForSplitPoint,
    EvaluationPerOrgUnit,
    HighChartsData,
} from '../interfaces/Evaluation';
import {
    createHighChartsData,
    joinRealAndPredictedData,
    normalizeEvaluationModelsToSharedPeriods,
} from './EvaluationResponse';
import { PERIOD_TYPES, sortPeriods } from './timePeriodUtils';

const Y_AXIS_HEADROOM_MULTIPLIER = 1.05;

export type PlotDataResult = {
    evaluationEntries: EvaluationEntryExtend[];
    actualCases: DataElement[];
    splitPeriods: string[];
    evaluation: BackTestRead;
};

type GroupedEntriesBySplitPeriod = Map<
    string,
    Map<string, EvaluationEntryExtend[]>
>;

type GroupedPlotDataResult = {
    actualCasesByOrgUnit: Map<string, DataElement[]>;
    entriesBySplitPeriod: GroupedEntriesBySplitPeriod;
    evaluation: BackTestRead;
    quantileFunc: (item: EvaluationEntry) => string;
};

const getOrCreateMapValue = <TKey, TValue>(
    map: Map<TKey, TValue>,
    key: TKey,
    createValue: () => TValue,
): TValue => {
    const existingValue = map.get(key);

    if (existingValue !== undefined) {
        return existingValue;
    }

    const newValue = createValue();
    map.set(key, newValue);
    return newValue;
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

const groupPlotDataBySplitPeriodAndOrgUnit = (
    dataForEvaluation: PlotDataResult,
): GroupedPlotDataResult => {
    const entriesBySplitPeriod: GroupedEntriesBySplitPeriod = new Map();
    const actualCasesByOrgUnit = new Map<string, DataElement[]>();
    const quantiles = new Set<number>();

    dataForEvaluation.evaluationEntries.forEach((entry) => {
        quantiles.add(entry.quantile);

        const entriesByOrgUnit = getOrCreateMapValue(
            entriesBySplitPeriod,
            entry.splitPeriod,
            () => new Map(),
        );
        const entries = getOrCreateMapValue(
            entriesByOrgUnit,
            entry.orgUnit,
            () => [],
        );
        entries.push(entry);
    });

    dataForEvaluation.actualCases.forEach((item) => {
        const actualCases = getOrCreateMapValue(
            actualCasesByOrgUnit,
            item.ou,
            () => [],
        );
        actualCases.push(item);
    });

    return {
        actualCasesByOrgUnit,
        entriesBySplitPeriod,
        evaluation: dataForEvaluation.evaluation,
        quantileFunc: createQuantileFunc(
            Array.from(quantiles).sort((a, b) => a - b),
        ),
    };
};

export const plotResultsToViewData = (
    data: PlotDataResult[],
): EvaluationForSplitPoint[] => {
    const periodType = data[0]?.evaluation?.dataset?.periodType;
    const groupedData = data.map(groupPlotDataBySplitPeriodAndOrgUnit);
    const splitPeriods = new Set<string>();
    const orgUnits = new Set<string>();

    groupedData.forEach(({ entriesBySplitPeriod }) => {
        entriesBySplitPeriod.forEach((entriesByOrgUnit, splitPeriod) => {
            splitPeriods.add(splitPeriod);
            entriesByOrgUnit.forEach((_, orgUnit) => {
                orgUnits.add(orgUnit);
            });
        });
    });

    const allSplitPeriods = periodType
        ? sortPeriods(
                Array.from(splitPeriods),
                periodType as keyof typeof PERIOD_TYPES,
            )
        : Array.from(splitPeriods);

    const allOrgunits = Array.from(orgUnits);

    return allSplitPeriods.map((splitPeriod: string) => {
        return {
            splitPoint: splitPeriod,
            evaluation: allOrgunits.map((orgUnit: string) => {
                const models = groupedData.map((dataForEvaluation) => {
                    const evaluationEntries =
                        dataForEvaluation.entriesBySplitPeriod
                            .get(splitPeriod)
                            ?.get(orgUnit) ?? [];
                    const actualCasesForOrgunit =
                        dataForEvaluation.actualCasesByOrgUnit.get(orgUnit)
                        ?? [];
                    const highChartData = createHighChartsData(
                        evaluationEntries,
                        dataForEvaluation.quantileFunc,
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
