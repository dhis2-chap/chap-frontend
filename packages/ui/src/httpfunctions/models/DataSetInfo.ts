/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
export type DataSetInfo = {
    name: string;
    dataSources?: Array<DataSource>;
    type?: (string | null);
    firstPeriod?: (string | null);
    lastPeriod?: (string | null);
    covariates?: Array<string>;
    created?: (string | null);
    orgUnits?: Array<string>;
};

