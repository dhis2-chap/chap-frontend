/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SelectionBiasCandidate } from './SelectionBiasCandidate';
/**
 * Estimated selection bias of the best model on a specification, from a bootstrap over its split points.
 */
export type SelectionBias = {
    /**
     * Id of the metric that was compared with the baseline.
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
     * Horizon distances whose forecasts were scored.
     */
    horizonDistances: Array<number>;
    /**
     * A left-out split point is only scored when it is more than this many splits from every drawn one, so the two share no target period: the largest minus the smallest horizon distance scored.
     */
    gapSplits: number;
    /**
     * Split points used, in order: the periods each split predicted from.
     */
    splitPeriods: Array<string>;
    /**
     * Every candidate model, best first.
     */
    candidates: Array<SelectionBiasCandidate>;
    /**
     * Backtest of the model picked on all split points.
     */
    selectedBacktestId: number;
    /**
     * The picked model's comparison with the baseline over all split points.
     */
    validationValue: number;
    /**
     * How much of the picked model's lead is expected to be luck: the mean, over the scored draws, of the picked model's value minus the draw's pick's value on the split points the draw left out. Zero when every draw picks the same model. Too low when models do well or badly for longer stretches than blockSize split points.
     */
    estimatedBias: number;
    /**
     * Estimated comparison on new data: validationValue - estimatedBias.
     */
    estimatedValue: number;
    /**
     * Number of consecutive split points drawn together.
     */
    blockSize: number;
    /**
     * Number of draws.
     */
    nDraws: number;
    /**
     * Draws that left out a split point more than gapSplits from every drawn one. Only these are used.
     */
    nDrawsScored: number;
};

