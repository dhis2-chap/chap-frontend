/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A backtest's aggregated metrics compared with one reference model's.
 */
export type ReferenceComparison = {
    /**
     * Id of the reference model's configured model.
     */
    configuredModelId: number;
    /**
     * Map of metric id to the metric's comparison value, positive meaning better than the reference. Only metrics with a comparison operator are included; null when the comparison is undefined.
     */
    values: Record<string, (number | null)>;
};

