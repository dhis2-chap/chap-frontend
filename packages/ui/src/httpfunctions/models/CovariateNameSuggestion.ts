/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One suggested covariate name for a model-independent dataset, with where the suggestion comes from.
 */
export type CovariateNameSuggestion = {
    /**
     * Covariate name as it should appear in the dataset.
     */
    name: string;
    /**
     * True when the name comes from CHAP's built-in list of standard covariate names.
     */
    standard: boolean;
    /**
     * Names of the live model templates and configured models that need this covariate.
     */
    requiredBy?: Array<string>;
};

