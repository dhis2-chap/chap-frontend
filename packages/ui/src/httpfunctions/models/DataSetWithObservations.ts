/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { ObservationBase } from './ObservationBase';
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
    id: number;
    covariates?: Array<string>;
    firstPeriod?: (string | null);
    lastPeriod?: (string | null);
    orgUnits?: (Array<string> | null);
    created: (string | null);
    periodType?: (string | null);
    geojson?: (string | null);
    observations: Array<ObservationBase>;
};

