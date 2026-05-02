export const DEFAULT_XAI_METHOD = 'shap_auto';

export const COVARIATE_SOURCE_DATASET_MATCH = 'dataset_match';

export type FidelityTier = 'high' | 'medium' | 'low';

export interface SurrogateQuality {
    rSquared?: number;
    mae?: number;
    mape?: number;
    nSamples?: number;
    nUniqueRows?: number;
    constantFeatures?: string[];
    permutationRemovedFeatures?: string[];
    residualMean?: number | null;
    residualStd?: number | null;
    fidelityTier?: FidelityTier;
    targetTransformMethod?: string | null;
    selectedModelDisplayName?: string;
}

export interface CovariateProvenance {
    source?: string;
    detail?: string;
}
