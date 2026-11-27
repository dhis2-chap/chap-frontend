/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Run HPO and evaluate the selected configuration using an existing backtest specification.
 */
export type MakeHpoBacktestRequest = {
    /**
     * Human-friendly name for the resulting backtest row.
     */
    name: string;
    modelTemplateId: number;
    backtestSpecificationId: number;
    additionalContinuousCovariates?: Array<string>;
    nTrials?: number;
};

