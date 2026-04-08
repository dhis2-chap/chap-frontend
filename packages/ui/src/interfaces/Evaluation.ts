import { EvaluationEntry } from '../httpfunctions';

export type EvaluationEntryExtend = EvaluationEntry & {
    modelName?: string;
};

export type EvaluationForSplitPoint = {
    evaluation: EvaluationPerOrgUnit[];
    splitPoint: string;
};

export type EvaluationPerOrgUnit = {
    orgUnitName: string;
    orgUnitId: string;
    models: ModelData[];
};

export type HighChartsLinePoint = [number];
export type HighChartsRangePoint = [number, number];

export type HighChartsData = {
    periods: string[];
    ranges: Array<HighChartsRangePoint | null>;
    averages: Array<HighChartsLinePoint | null>;
    realValues?: Array<number | null>;
    midranges?: Array<HighChartsRangePoint | null>;
};

export type ModelData = {
    data: HighChartsData;
    modelName: string;
};
