/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Tell the server which feature to fetch from which data source when materialising a dataset.
 */
export type FetchRequest = {
    /**
     * Canonical feature name (matching a `FeatureType.name`).
     */
    featureName: string;
    /**
     * Canonical name of the source to pull from.
     */
    dataSourceName: string;
};

