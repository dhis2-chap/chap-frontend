/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Computed threshold lines for a single (period, location).
 */
export type ThresholdEntry = {
    /**
     * Period the thresholds apply to.
     */
    period: string;
    /**
     * Location the thresholds apply to.
     */
    location: string;
    /**
     * One threshold per line, in the same order as the response's `lines`. An element is `null` when that line could not be computed for this (period, location).
     */
    values: Array<(number | null)>;
};

