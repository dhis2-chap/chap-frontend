/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Catalogue entry for one available metric visualisation (returned by `/v1/visualization/metrics/{backtest_id}` and similar).
 */
export type VisualizationInfo = {
    /**
     * Canonical plot identifier used in URLs.
     */
    id: string;
    /**
     * Human-friendly plot name shown in pickers.
     */
    displayName: string;
    /**
     * Short paragraph explaining what the plot shows.
     */
    description: string;
};

