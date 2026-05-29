/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSource } from './DataSource';
import type { PredictionInfo } from './PredictionInfo';
export type ConfiguredModelWithDataSourceReadWithPredictions = {
    id: number;
    name: string;
    created: (string | null);
    configuredModel: (ConfiguredModelRead | null);
    startPeriod: (string | null);
    orgUnits: Array<string>;
    dataSources: Array<DataSource>;
    periodType: (string | null);
    predictions?: Array<PredictionInfo>;
};

