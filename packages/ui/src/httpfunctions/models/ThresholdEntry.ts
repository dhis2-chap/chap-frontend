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
     * One threshold per requested line, in the order of the request's line parameter list (`quantile`, `stdMultiplier`, ...). A scalar or default request yields one element. An element is `null` when that line could not be computed.
     */
    values: Array<(number | null)>;
};

