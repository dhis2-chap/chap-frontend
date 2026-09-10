/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Parameters for the seasonal percentile (WHO endemic channel) strategy.
 */
export type PercentileParams = {
    type: string;
    /**
     * Percentile of historical same-season values, as a fraction in [0, 1]. A list produces one threshold line per entry, e.g. `[0.25, 0.75]` for the endemic channel band.
     */
    quantile?: (number | Array<number>);
    /**
     * Number of the most recent complete years in the dataset to compute the baseline from. A partial final year is excluded. `null` uses all available history.
     */
    baselineYears?: (number | null);
};

