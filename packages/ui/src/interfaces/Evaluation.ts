import { EvaluationEntry } from '../httpfunctions'

export type EvaluationEntryExtend = EvaluationEntry & {
    modelName?: string
}

export type EvaluationForSplitPoint = {
    evaluation: EvaluationPerOrgUnit[]
    splitPoint: string
}

export type EvaluationPerOrgUnit = {
    orgUnitName: string
    orgUnitId: string
    models: ModelData[]
}

export type HighChartsData = {
    periods: string[]
    ranges: number[][]
    averages: number[][]
    realValues?: number[]
    midranges?: number[][]
}

export type ModelData = {
    data: HighChartsData
    modelName: string
}
