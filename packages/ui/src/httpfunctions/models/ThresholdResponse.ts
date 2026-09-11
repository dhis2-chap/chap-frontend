/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PercentileParams } from './PercentileParams';
import type { SeasonalParams } from './SeasonalParams';
import type { ThresholdEntry } from './ThresholdEntry';
/**
 * Threshold lines for every requested (period, location), with the resolved params echoed back.
 */
export type ThresholdResponse = {
    /**
     * The resolved parameters the thresholds were computed with, defaults applied.
     */
    params: (SeasonalParams | PercentileParams);
    /**
     * The line parameter value each threshold was computed from (a quantile, a std multiplier, ...), one per line, in the order of every entry's `values`. A scalar or default request yields one element.
     */
    lines: Array<number>;
    /**
     * One entry per requested (period, location), including combinations no threshold could be computed for, whose `values` are then `null`.
     */
    entries: Array<ThresholdEntry>;
};

