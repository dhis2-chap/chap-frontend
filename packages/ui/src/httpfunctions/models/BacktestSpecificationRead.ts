/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BacktestRead } from './BacktestRead';
import type { DataSetMeta } from './DataSetMeta';
/**
 * A specification with every backtest under it: the benchmark leaderboard in one response.
 */
export type BacktestSpecificationRead = {
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
     * Number of times the model is retrained, evenly spaced across the splits. 1 means train once.
     */
    nRetrain?: number;
    /**
     * Id of the registered future-weather provider supplying climate covariates for each forecast window. Use the same provider here and on the prediction so backtest scores reflect what the model will see in production. See GET /v1/analytics/weather-providers.
     */
    futureWeatherProvider?: string;
    /**
     * Primary key of the specification.
     */
    id: number;
    /**
     * Slim summary of the dataset the specification evaluates against.
     */
    dataset: DataSetMeta;
    /**
     * Org units the evaluation runs over, resolved from the dataset.
     */
    orgUnits: Array<string>;
    /**
     * Every backtest that ran under this specification, newest first. Comparable by construction.
     */
    backtests: Array<BacktestRead>;
};

