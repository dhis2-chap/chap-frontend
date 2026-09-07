/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Parameters for the seasonal mean + k*std strategy.
 */
export type SeasonalParams = {
    type: string;
    /**
     * Number of standard deviations above the seasonal mean. A list produces one threshold line per entry.
     */
    stdMultiplier?: (number | Array<number>);
};

