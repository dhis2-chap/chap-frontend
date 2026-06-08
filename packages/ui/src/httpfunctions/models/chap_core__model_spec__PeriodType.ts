/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Granularity at which a model accepts inputs and emits forecasts.
 *
 * `any` means the model handles whatever the dataset's `period_type` is.
 */
export enum chap_core__model_spec__PeriodType {
    WEEK = 'week',
    MONTH = 'month',
    ANY = 'any',
    YEAR = 'year',
}
