/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OutbreakMetricsRow } from './OutbreakMetricsRow';
/**
 * Outbreak-detection metrics of a backtest judged against an alert policy.
 */
export type OutbreakMetricsResponse = {
    /**
     * Category names in severity order, as the categorical metrics see them: `none` followed by the level names.
     */
    categories: Array<string>;
    /**
     * One row per group, in sorted group order; a single row when not grouped.
     */
    rows: Array<OutbreakMetricsRow>;
};

