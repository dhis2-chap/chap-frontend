/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { FeatureCollectionModel } from './FeatureCollectionModel';
import type { FetchRequest } from './FetchRequest';
import type { MaskedRange } from './MaskedRange';
import type { ObservationBase } from './ObservationBase';
/**
 * Request body for building a dataset: metadata + polygons + observations (provided or fetched).
 */
export type DatasetMakeRequest = {
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
     * Inclusive period ranges in which `disease_cases` is masked. Set at creation and never changed. Deletes data: `disease_cases` inside the ranges is stored as empty and the submitted values cannot be recovered.
     */
    maskedRanges?: (Array<MaskedRange> | null);
};

