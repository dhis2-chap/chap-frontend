/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MonitoringPoint } from './MonitoringPoint';
/**
 * A prediction setup's live performance on one metric relative to a baseline model, next to its backtest's.
 */
export type PredictionSetupMonitoring = {
    /**
     * Id of the metric that was computed.
     */
    metricId: string;
    /**
     * Name of the baseline model the values are compared with.
     */
    baselineModel: string;
    /**
     * One-line description of what the comparison values mean.
     */
    comparisonDescription: string;
    /**
     * The backtest's aggregate metric compared with the baseline's backtest on the same specification; `None` until the baseline's backtest is done, or when the comparison is undefined.
     */
    evaluationValue: (number | null);
    /**
     * One entry per scored run: evaluation points first, then prediction points, each in period order. Evaluation points are missing until the baseline's backtest is done, and predictions without a stored baseline forecast are left out.
     */
    points: Array<MonitoringPoint>;
};

