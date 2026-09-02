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
     * The resolved parameters the thresholds were computed with, defaults applied. Its line parameter list states the ordering of each entry's `values`.
     */
    params: (SeasonalParams | PercentileParams);
    /**
     * One entry per (period, location).
     */
    entries: Array<ThresholdEntry>;
};

