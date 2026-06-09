/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single data point in a v1-format request: a value for one (period, org-unit) pair.
 */
export type DataElement = {
    /**
     * Period identifier (DHIS2-style, e.g. `202403`).
     */
    pe: string;
    /**
     * Org-unit identifier.
     */
    ou: string;
    /**
     * Observed value; `None` is allowed for known-missing observations.
     */
    value: (number | null);
};

