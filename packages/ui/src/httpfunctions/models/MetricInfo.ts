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
    /**
     * Display suffix for the raw score; does not rescale the score.
     */
    unit?: string | null;
    /**
     * Ideal value in raw score units. Null when no fixed target applies.
     */
    target?: number | null;
    /**
     * Whether deviations in either direction are worse, or only scores below the target.
     */
    targetBehavior?: 'closest' | 'at_least';
};
