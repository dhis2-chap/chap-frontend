/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { FeatureCollectionModel } from './FeatureCollectionModel';
import type { MaskedRange } from './MaskedRange';
import type { ObservationBase } from './ObservationBase';
/**
 * Request body for creating a dataset directly from a fully-materialised observation list + polygons.
 */
export type DatasetCreate = {
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
     * Every observation that should land in the new dataset.
     */
    observations: Array<ObservationBase>;
    /**
     * GeoJSON polygon set for the dataset's org units.
     */
    geojson: FeatureCollectionModel;
};

