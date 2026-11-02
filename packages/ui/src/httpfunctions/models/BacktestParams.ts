/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Resolved backtest parameters, including validation across fields.
 */
export type BacktestParams = {
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
};

