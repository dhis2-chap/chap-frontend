/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Backtest evaluation entry: a prediction plus the split it was produced under.
 */
export type EvaluationEntry = {
    /**
     * Org-unit identifier the prediction is for.
     */
    orgUnit: string;
    /**
     * Period the prediction is for.
     */
    period: string;
    /**
     * Quantile of the predictive distribution this value represents (0.0 to 1.0).
     */
    quantile: number;
    /**
     * Predicted value at the given quantile.
     */
    value: number;
    /**
     * Period at which the rolling split was advanced for this prediction.
     */
    splitPeriod: string;
};

