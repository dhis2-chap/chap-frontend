/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSetMeta } from './DataSetMeta';
import type { LeaderboardBacktestRead } from './LeaderboardBacktestRead';
import type { MetricInfo } from './MetricInfo';
import type { ReferenceModelResult } from './ReferenceModelResult';
/**
 * A specification with every backtest under it: the benchmark leaderboard in one response.
 */
export type BacktestSpecificationRead = {
    /**
     * Number of periods to forecast at each split.
     */
    nPeriods?: number;
    /**
     * Total number of rolling train/test splits.
     */
    nSplits?: number;
    /**
     * Number of periods to advance between successive splits.
     */
    stride?: number;
    /**
     * Number of times the model is trained, evenly spaced across the splits. 1 means train once. Cannot exceed the number of splits.
     */
    nRetrain?: number;
    /**
     * Source of weather data for each forecast window. Use the same provider for backtesting and prediction so scores reflect production conditions.
     */
    futureWeatherProvider?: string;
    /**
     * Dataset column to evaluate as the target.
     */
    targetColumn?: string;
    /**
     * Primary key of the specification.
     */
    id: number;
    /**
     * Slim summary of the dataset the specification evaluates against.
     */
    dataset: DataSetMeta;
    /**
     * Org units the evaluation runs over, resolved from the dataset.
     */
    orgUnits: Array<string>;
    /**
     * Every backtest that ran under this specification, newest first. Comparable by construction.
     */
    backtests: Array<LeaderboardBacktestRead>;
    /**
     * The current version of each built-in baseline model on this specification.
     */
    baselines?: Array<ReferenceModelResult>;
    /**
     * The newest backtest of each comparison model on this specification; null unless `includeComparisonModels` is set.
     */
    comparisonModels?: (Array<ReferenceModelResult> | null);
    /**
     * Every metric in configured ranking order, marked with isSelected for the default display. Sort by the selected metrics in this order, using each metric's direction or target.
     */
    metrics?: Array<MetricInfo>;
    /**
     * Built-in baseline name to use for ratios and model promotion.
     */
    defaultBaselineModel: string;
};

