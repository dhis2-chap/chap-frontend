/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to backtest an already-imported dataset against a configured model.
 */
export type MakeBacktestRequest = {
    /**
     * Number of periods to forecast at each split.
     */
    nPeriods?: number;
    /**
     * Total number of rolling train/test splits.
     */
    nSplits?: number;
    /**
     * Number of periods to advance between successive splits.
     */
    stride?: number;
    /**
     * Human-friendly name for the resulting backtest row.
     */
    name: string;
    /**
     * Canonical name of the configured model to backtest.
     */
    modelId: string;
    /**
     * Foreign key to the dataset the backtest evaluates against.
     */
    datasetId: number;
};

