/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSetMeta } from './DataSetMeta';
/**
 * API read shape for a `Backtest`. Same fields as the DB row plus the joined dataset / model / setup links.
 *
 * The `BacktestParams` fields are read off the linked `BacktestSpecification` through
 * `Backtest`'s properties of the same name, so the wire shape is unchanged by the
 * specification extraction. Callers must eager-load `Backtest.specification`.
 */
export type BacktestRead = {
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
     * Primary key of the backtest.
     */
    id: number;
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
     * Slim dataset summary the backtest evaluated against.
     */
    dataset: DataSetMeta;
    /**
     * Id of the `BacktestSpecification` this backtest ran under; backtests sharing it are comparable.
     */
    specificationId: number;
    /**
     * Map of metric id to aggregated score across all splits / org units.
     */
    aggregateMetrics: Record<string, number>;
    /**
     * Configured model used for the backtest, joined for convenience.
     */
    configuredModel: (ConfiguredModelRead | null);
    /**
     * Id of the attached `PredictionSetup`, if one exists.
     */
    predictionSetupId?: (number | null);
};

