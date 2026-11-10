/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MonitoringSource } from './MonitoringSource';
/**
 * One run of a prediction setup, a backtest split or a live prediction, compared with the baseline model.
 *
 * Values come from the metric's comparison operator: positive means better than the
 * baseline and zero means equal. They are null where the comparison is undefined, for
 * example a skill ratio against a baseline score of 0.
 */
export type MonitoringPoint = {
    /**
     * Last period the run had data for, i.e. the period it predicted from.
     */
    period: string;
    /**
     * `evaluation` for a backtest split, `prediction` for a live prediction of the setup.
     */
    source: MonitoringSource;
    /**
     * The run's metric compared with the baseline's, over the forecasts both made that have an observed value, pooled over org units and horizons.
     */
    value: (number | null);
    /**
     * The same comparison over all runs of the same source up to and including this one.
     */
    runningValue: (number | null);
    /**
     * Number of (org unit, period, horizon) forecasts scored; grows as later runs bring in observed cases.
     */
    nObserved: number;
};

