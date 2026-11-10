/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { FeatureCollectionModel } from './FeatureCollectionModel';
import type { FetchRequest } from './FetchRequest';
import type { MaskedRange } from './MaskedRange';
import type { ObservationBase } from './ObservationBase';
import type { ObservationColumns } from './ObservationColumns';
/**
 * Request body for building a dataset: metadata + polygons + observations (provided or fetched).
 *
 * Send the observations either as ``providedData`` (one object per observation) or as
 * ``providedDataColumns`` (columnar), not both.
 */
export type DatasetMakeRequest = {
    /**
     * GeoJSON polygon set for the dataset's org units.
     */
    geojson: FeatureCollectionModel;
    /**
     * Observations, one object per (org unit, period, feature).
     */
    providedData?: Array<ObservationBase>;
    /**
     * Features whose observations the server should fetch from a registered source.
     */
    dataToBeFetched: Array<FetchRequest>;
    /**
     * Name of dataset
     */
    name: string;
    /**
     * Column to predict. Set when the dataset is created and reused by its runs.
     */
    targetColumn?: string;
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
    /**
     * Observations in columnar form; use instead of `providedData` for large datasets.
     */
    providedDataColumns?: (ObservationColumns | null);
};

