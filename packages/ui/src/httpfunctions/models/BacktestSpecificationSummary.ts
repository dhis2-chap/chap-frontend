/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSetMeta } from './DataSetMeta';
/**
 * One row of the specification list: the setup plus how much has been run under it, without the backtests.
 */
export type BacktestSpecificationSummary = {
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
     * Number of org units the evaluation runs over.
     */
    orgUnitCount: number;
    /**
     * Number of backtests that ran under this specification.
     */
    backtestCount: number;
};

