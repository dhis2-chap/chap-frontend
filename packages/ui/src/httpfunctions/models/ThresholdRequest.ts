/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PercentileParams } from './PercentileParams';
import type { SeasonalParams } from './SeasonalParams';
/**
 * Request body for computing thresholds (endemic channel) for a dataset.
 */
export type ThresholdRequest = {
    /**
     * Primary key of the dataset to compute thresholds from.
     */
    datasetId: number;
    /**
     * Periods to produce thresholds for, e.g. `["2024-01", "2024-02"]`.
     */
    periodIds: Array<string>;
    /**
     * Optional locations to restrict the result to. When omitted or empty, every location in the dataset is returned.
     */
    locations?: (Array<string> | null);
    /**
     * Strategy-specific parameters; the `type` field selects the strategy.
     */
    params: (SeasonalParams | PercentileParams);
};

