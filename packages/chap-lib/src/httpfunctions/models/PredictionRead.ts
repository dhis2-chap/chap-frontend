/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForecastRead } from './ForecastRead'
export type PredictionRead = {
    datasetId: number
    estimatorId: string
    nPeriods: number
    id: number
    forecasts: Array<ForecastRead>
}
