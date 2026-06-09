/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelDB } from './ConfiguredModelDB';
import type { DataSetMeta } from './DataSetMeta';
/**
 * Summary read view for a prediction — fields + joined dataset/model, no per-period forecasts.
 */
export type PredictionInfo = {
    /**
     * Foreign key to the `DataSet` the prediction was run against.
     */
    datasetId: number;
    /**
     * Name of the configured model that produced the prediction.
     */
    modelId: string;
    /**
     * Number of periods the model was asked to forecast.
     */
    nPeriods: number;
    /**
     * Human-friendly name for the prediction run.
     */
    name: string;
    /**
     * Server-side timestamp when the prediction row was created.
     */
    created: string;
    /**
     * Free-form metadata bag attached to the prediction (e.g. provenance, scheduler context).
     */
    metaData?: Record<string, any>;
    /**
     * Identifiers of the org units the prediction was run for.
     */
    orgUnits?: Array<string>;
    /**
     * Primary key of the prediction.
     */
    id: number;
    /**
     * Configured model used for the prediction, joined for convenience.
     */
    configuredModel: (ConfiguredModelDB | null);
    /**
     * Slim dataset summary the prediction was run against.
     */
    dataset: DataSetMeta;
};

