/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeatureCollectionModel } from './FeatureCollectionModel';
import type { ObservationBase } from './ObservationBase';
/**
 * Request body for a one-shot run of a prediction setup. Rejects unknown fields with HTTP 422.
 */
export type RunPredictionSetupRequest = {
    /**
     * Human-friendly name for the one-shot prediction run.
     */
    name: string;
    /**
     * GeoJSON polygon set for the org units in the run.
     */
    geojson: FeatureCollectionModel;
    /**
     * Observations supplied directly by the caller.
     */
    providedData: Array<ObservationBase>;
    /**
     * Free-form run-type marker stored alongside the prediction.
     */
    type?: (string | null);
    /**
     * Number of future periods to forecast.
     */
    nPeriods?: number;
};

