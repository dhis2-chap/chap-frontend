/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSetMeta } from './DataSetMeta';
/**
 * API read shape for a `Backtest`. Same fields as the DB row plus the joined dataset / model / setup links.
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
     * Slim dataset summary the backtest evaluated against.
     */
    dataset: DataSetMeta;
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

