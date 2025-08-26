/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSetMeta } from './DataSetMeta';
export type BackTestRead = {
    datasetId: number;
    modelId: string;
    name?: (string | null);
    created?: (string | null);
    id: number;
    orgUnits?: Array<string>;
    splitPeriods?: Array<string>;
    dataset: DataSetMeta;
    aggregateMetrics: Record<string, number>;
    configuredModel: ConfiguredModelRead;
};

