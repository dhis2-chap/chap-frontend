/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
export type DataSetInfo = {
    name: string;
    dataSources?: (Array<DataSource> | null);
    type?: (string | null);
    id?: (number | null);
    covariates?: Array<string>;
    firstPeriod?: (string | null);
    lastPeriod?: (string | null);
    orgUnits?: (Array<string> | null);
    created?: (string | null);
    periodType?: (string | null);
};

