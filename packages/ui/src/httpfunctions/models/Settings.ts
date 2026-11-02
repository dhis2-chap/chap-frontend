/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BacktestParams } from './BacktestParams';
/**
 * Installation-wide defaults. PUT replaces the complete settings record.
 */
export type Settings = {
    /**
     * Metric ids in display and ranking order. Unlisted metrics are appended in their default order.
     */
    metricSortOrder: Array<string>;
    /**
     * Metric ids shown by default, ordered by metricSortOrder.
     */
    selectedMetrics: Array<string>;
    /**
     * Built-in baseline name, independent of its version (for example 'persistence').
     */
    defaultBaselineModel: string;
    /**
     * Defaults for backtests of weekly data.
     */
    weeklyBacktestParams: BacktestParams;
    /**
     * Defaults for backtests of monthly data.
     */
    monthlyBacktestParams: BacktestParams;
};

