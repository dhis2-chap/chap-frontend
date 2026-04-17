/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSource } from './DataSource';
export type ConfiguredModelWithDataSourceRead = {
    id: number;
    name: string;
    created: (string | null);
    configuredModel: (ConfiguredModelRead | null);
    startPeriod: (string | null);
    orgUnits: Array<string>;
    dataSourceMapping: Array<DataSource>;
    periodType: (string | null);
};

