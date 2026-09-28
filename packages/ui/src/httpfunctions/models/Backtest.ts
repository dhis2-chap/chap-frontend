/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Persisted backtest row. Owns its forecasts, metrics, and (optionally) a `PredictionSetup`.
 */
export type Backtest = {
    /**
     * Foreign key to the `DataSet` the backtest evaluates against.
     */
    datasetId: number;
    /**
     * Name of the configured model that was backtested.
     */
    modelId: string;
    /**
     * Optional human-friendly name for the backtest.
     */
    name?: (string | null);
    /**
     * Server-side timestamp when the backtest row was created.
     */
    created?: (string | null);
    /**
     * Snapshot of the parent template's version at backtest-creation time (may differ from current template version).
     */
    modelTemplateVersion?: (string | null);
    /**
     * Primary key.
     */
    id?: (number | null);
    /**
     * Identifiers of every org unit the backtest scored predictions over.
     */
    orgUnits?: Array<string>;
    /**
     * Periods at which the rolling backtest's train/test split was advanced.
     */
    splitPeriods?: Array<string>;
    /**
     * Largest 1-based horizon distance scored in this backtest; horizon coordinates run 1..max_horizon_distance.
     */
    maxHorizonDistance?: (number | null);
    /**
     * Release version of chap-core that produced the backtest; null for dev checkouts and rows predating the column.
     */
    chapVersion?: (string | null);
    /**
     * Foreign key to the `BacktestSpecification` this backtest ran under.
     */
    specificationId: number;
    /**
     * Map of metric id to aggregated score across all splits / org units.
     */
    aggregateMetrics?: Record<string, number>;
    /**
     * Foreign key to the `ConfiguredModelDB` row used to run the backtest.
     */
    modelDbId: number;
    /**
     * Number of periods to forecast at each split.
     */
    readonly nPeriods: number;
    /**
     * Total number of rolling train/test splits.
     */
    readonly nSplits: number;
    /**
     * Number of periods to advance between successive splits.
     */
    readonly stride: number;
    /**
     * Number of times the model is retrained, evenly spaced across the splits. 1 means train once.
     */
    readonly nRetrain: number;
    /**
     * Id of the registered future-weather provider supplying climate covariates for each forecast window. Use the same provider here and on the prediction so backtest scores reflect what the model will see in production. See GET /v1/analytics/weather-providers.
     */
    readonly futureWeatherProvider: string;
};

