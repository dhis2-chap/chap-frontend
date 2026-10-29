/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OutbreakMetricKind } from './OutbreakMetricKind';
/**
 * Catalogue entry for one registered outbreak metric.
 */
export type OutbreakMetricInfo = {
    /**
     * Metric identifier, the key it is reported under.
     */
    id: string;
    /**
     * Human-friendly metric name.
     */
    displayName: string;
    /**
     * What the metric measures.
     */
    description?: string;
    /**
     * `binary` metrics are reported per alert level; `categorical` metrics judge the policy as a whole.
     */
    kind: OutbreakMetricKind;
};

