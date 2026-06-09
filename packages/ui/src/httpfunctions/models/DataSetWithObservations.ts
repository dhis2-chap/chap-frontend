/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { ObservationBase } from './ObservationBase';
/**
 * Read view that bundles a dataset together with its observations.
 */
export type DataSetWithObservations = {
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
     * Primary key of the dataset.
     */
    id: number;
    /**
     * Names of the covariates (features) actually present in the dataset's observations.
     */
    covariates?: Array<string>;
    /**
     * Earliest period present in the observations.
     */
    firstPeriod?: (string | null);
    /**
     * Latest period present in the observations.
     */
    lastPeriod?: (string | null);
    /**
     * Identifiers of every org unit that has at least one observation.
     */
    orgUnits?: (Array<string> | null);
    /**
     * Server-side timestamp when the dataset was registered.
     */
    created: (string | null);
    /**
     * Granularity of the periods (`month`, `week`, ...).
     */
    periodType?: (string | null);
    /**
     * GeoJSON `FeatureCollection` for the dataset's org units, stored as a string.
     */
    geojson?: (string | null);
    /**
     * Every observation belonging to this dataset.
     */
    observations: Array<ObservationBase>;
};

