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
     * Number of times the model is trained, evenly spaced across the splits. 1 means train once. Cannot exceed the number of splits.
     */
    nRetrain?: number;
    /**
     * Source of weather data for each forecast window. Use the same provider for backtesting and prediction so scores reflect production conditions.
     */
    futureWeatherProvider?: string;
    /**
     * Dataset column to evaluate as the target.
     */
    targetColumn?: string;
    /**
     * Human-friendly name for the resulting backtest row.
     */
    name: string;
    /**
     * Configured model to backtest: either the integer primary key or the canonical string name.
     */
    modelId: (number | string);
    /**
     * Foreign key to the dataset the backtest evaluates against.
     */
    datasetId: number;
};

