/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One computed threshold for a single (period, location).
 */
export type ThresholdEntry = {
    /**
     * Period the threshold applies to.
     */
    period: string;
    /**
     * Location the threshold applies to.
     */
    location: string;
    /**
     * Computed threshold value, or `None` if it could not be computed.
     */
    value: (number | null);
};

