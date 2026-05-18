/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSource } from './DataSource';
export type ConfiguredModelWithDataSourceRead = {
    id: number;
    created: (string | null);
    configuredModel: (ConfiguredModelRead | null);
    backtestId: number;
    startPeriod: (string | null);
    orgUnits: Array<string>;
    dataSources: Array<DataSource>;
    periodType: (string | null);
    archived?: boolean;
};

