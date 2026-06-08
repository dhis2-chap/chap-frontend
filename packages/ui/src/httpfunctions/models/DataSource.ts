/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Mapping from a covariate name to the DHIS2 data element id used to source it.
 */
export type DataSource = {
    /**
     * Canonical covariate name (matching a `FeatureType.name`).
     */
    covariate: string;
    /**
     * External identifier of the data element to pull values from.
     */
    dataElementId: string;
};

