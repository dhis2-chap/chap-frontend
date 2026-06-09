/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Catalogue row for one covariate type that models can request as input.
 */
export type FeatureType = {
    /**
     * Human-friendly name shown to operators in pickers and plot titles.
     */
    displayName: string;
    /**
     * Short paragraph explaining what the feature represents.
     */
    description: string;
    /**
     * Canonical machine-readable identifier (e.g. `rainfall`, `mean_temperature`).
     */
    name: string;
};

