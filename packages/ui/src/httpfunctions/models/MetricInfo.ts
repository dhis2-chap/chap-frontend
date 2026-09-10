/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Catalogue entry for one scoring metric (CRPS, MAE, ...).
 */
export type MetricInfo = {
    /**
     * Canonical metric identifier used in URLs and request bodies.
     */
    id: string;
    /**
     * Human-friendly metric name shown in pickers.
     */
    displayName: string;
    /**
     * Short paragraph explaining what the metric measures.
     */
    description?: string;
};

