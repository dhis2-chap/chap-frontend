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
     * Number of times the model is retrained, evenly spaced across the splits. 1 means train once.
     */
    nRetrain?: number;
    /**
     * Id of the registered future-weather provider supplying climate covariates for each forecast window. Use the same provider here and on the prediction so backtest scores reflect what the model will see in production. See GET /v1/analytics/weather-providers.
     */
    futureWeatherProvider?: string;
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

