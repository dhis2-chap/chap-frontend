/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A candidate model, its comparison with the baseline over all split points and how often the draws pick it.
 */
export type SelectionBiasCandidate = {
    /**
     * Id of the candidate's backtest.
     */
    backtestId: number;
    /**
     * Id of the candidate's configured model.
     */
    configuredModelId: number;
    /**
     * Name of the candidate's configured model.
     */
    modelName: string;
    /**
     * Comparison with the baseline over all split points.
     */
    validationValue: number;
    /**
     * Number of scored draws in which this model was the best on the drawn split points.
     */
    nDrawsPicked: number;
};

