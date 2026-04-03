/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { FeatureCollectionModel } from './FeatureCollectionModel';
import type { FetchRequest } from './FetchRequest';
import type { ObservationBase } from './ObservationBase';
export type MakePredictionRequest = {
    modelId: string;
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
    geojson: FeatureCollectionModel;
    providedData: Array<ObservationBase>;
    dataToBeFetched: Array<FetchRequest>;
    metaData?: Record<string, any>;
    /**
     * When true, automatically train an XAI surrogate model after the prediction completes.
     */
    enableXai?: boolean;
    /**
     * Name of the XAI method to use for surrogate training (e.g. "shap_auto").
     * Defaults to "shap_auto" on the server when omitted.
     */
    xaiMethodName?: string;
};

