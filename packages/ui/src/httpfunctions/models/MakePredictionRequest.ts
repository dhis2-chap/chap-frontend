/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { FeatureCollectionModel } from './FeatureCollectionModel';
import type { FetchRequest } from './FetchRequest';
import type { ObservationBase } from './ObservationBase';
/**
 * Long-path request for kicking off a prediction: combines dataset construction + model parameters.
 */
export type MakePredictionRequest = {
    /**
     * Canonical name of the configured model to run.
     */
    modelId: string;
    /**
     * Number of future periods to forecast.
     */
    nPeriods?: number;
    /**
     * Name of dataset
     */
    name: string;
    /**
     * A mapping of covariate names to data element IDs from which to source the data
     */
    dataSources?: (Array<DataSource> | null);
    /**
     * Purpose of dataset, e.g., 'forecasting' or 'backtesting'
     */
    type?: (string | null);
    /**
     * GeoJSON polygon set for the dataset's org units.
     */
    geojson: FeatureCollectionModel;
    /**
     * Observations the caller is supplying directly.
     */
    providedData: Array<ObservationBase>;
    /**
     * Features whose observations the server should fetch from a registered source.
     */
    dataToBeFetched: Array<FetchRequest>;
    /**
     * Free-form metadata bag stored alongside the resulting prediction row.
     */
    metaData?: Record<string, any>;
};

