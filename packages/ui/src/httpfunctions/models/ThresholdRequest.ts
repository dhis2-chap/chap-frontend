/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request body for computing thresholds (endemic channel) for a dataset.
 */
export type ThresholdRequest = {
    /**
     * Primary key of the dataset to compute thresholds from.
     */
    datasetId: number;
    /**
     * Periods to produce a threshold for, e.g. `["2024-01", "2024-02"]`.
     */
    periodIds: Array<string>;
    /**
     * Registered threshold strategy id (see GET /thresholds/strategies).
     */
    strategy: string;
    /**
     * Optional locations to restrict the result to. When omitted or empty, every location in the dataset is returned.
     */
    locations?: (Array<string> | null);
    /**
     * Optional strategy-specific parameters.
     */
    params?: Record<string, any>;
};

