/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelDB } from './ConfiguredModelDB';
import type { ConfiguredModelWithDataSourceRead } from './ConfiguredModelWithDataSourceRead';
import type { DataSetMeta } from './DataSetMeta';
export type PredictionInfo = {
    datasetId: number;
    modelId: string;
    nPeriods: number;
    name: string;
    created: string;
    metaData?: Record<string, any>;
    orgUnits?: Array<string>;
    id: number;
    configuredModel: (ConfiguredModelDB | null);
    dataset: DataSetMeta;
    configuredModelWithDataSource?: (ConfiguredModelWithDataSourceRead | null);
};

