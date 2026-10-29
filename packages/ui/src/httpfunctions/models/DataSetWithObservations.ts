/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { MaskedRange } from './MaskedRange';
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
     * True if a user created the dataset directly, false if it was created as part of an evaluation or prediction.
     */
    createdManually?: boolean;
    /**
     * GeoJSON `FeatureCollection` for the dataset's org units, stored as a string.
     */
    geojson?: (string | null);
    /**
     * Every observation belonging to this dataset.
     */
    observations: Array<ObservationBase>;
};

