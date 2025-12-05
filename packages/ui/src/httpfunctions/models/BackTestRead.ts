/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead_Output } from './ConfiguredModelRead_Output';
import type { DataSetMeta } from './DataSetMeta';
export type BackTestRead = {
    datasetId: number;
    modelId: string;
    name?: (string | null);
    created?: (string | null);
    modelTemplateVersion?: (string | null);
    id: number;
    orgUnits?: Array<string>;
    splitPeriods?: Array<string>;
    dataset: DataSetMeta;
    aggregateMetrics: Record<string, number>;
    configuredModel: ConfiguredModelRead_Output;
};

