/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SurrogateQualityRead = {
    rSquared?: (number | null);
    mae?: (number | null);
    mape?: (number | null);
    nSamples?: number;
    nUniqueRows?: number;
    constantFeatures?: Array<string>;
    imputationRates?: Record<string, number>;
    removedFeatures?: Array<string>;
    selectedModelType?: (string | null);
    selectedModelDisplayName?: (string | null);
    nGroups?: (number | null);
    fidelityTier?: ('good' | 'moderate' | 'poor' | null);
    residualMean?: (number | null);
    residualStd?: (number | null);
    targetTransformed?: boolean;
    targetTransformMethod?: (string | null);
    permutationRemovedFeatures?: Array<string>;
    rSquaredTrain?: (number | null);
    generalizationGap?: (number | null);
};

