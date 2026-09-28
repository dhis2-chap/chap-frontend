/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One queued backtest job of a multi-model run.
 */
export type BacktestJob = {
    /**
     * Primary key of the configured model the job evaluates.
     */
    configuredModelId: number;
    /**
     * Identifier of the queued job; poll it via the jobs endpoints.
     */
    jobId: string;
};

