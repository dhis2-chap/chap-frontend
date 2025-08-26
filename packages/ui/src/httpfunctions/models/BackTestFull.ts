/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackTestForecast } from './BackTestForecast';
import type { BackTestMetric } from './BackTestMetric';
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSetMeta } from './DataSetMeta';
export type BackTestFull = {
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
    metrics: Array<BackTestMetric>;
    forecasts: Array<BackTestForecast>;
};

