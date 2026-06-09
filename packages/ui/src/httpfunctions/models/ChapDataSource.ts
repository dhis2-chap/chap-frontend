/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Catalogue entry describing one registered data source (chap-side metadata, not the DB-table row).
 */
export type ChapDataSource = {
    /**
     * Canonical identifier of the source.
     */
    name: string;
    /**
     * Human-friendly name shown in source pickers.
     */
    displayName: string;
    /**
     * Canonical feature names this source can deliver.
     */
    supportedFeatures: Array<string>;
    /**
     * Short paragraph describing what this source provides.
     */
    description: string;
    /**
     * Canonical name of the upstream dataset this source pulls from.
     */
    dataset: string;
};

