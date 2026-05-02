export const DEFAULT_XAI_METHOD = 'shap_auto';

export const COVARIATE_SOURCE_DATASET_MATCH = 'dataset_match';

export type FidelityTier = 'good' | 'moderate' | 'poor';

export function normalizeFidelityTier(raw: unknown): FidelityTier | undefined {
    if (raw === 'good' || raw === 'moderate' || raw === 'poor') return raw;
    return undefined;
}

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
    fidelityTier?: FidelityTier | string;
    targetTransformMethod?: string | null;
    selectedModelDisplayName?: string;
}

export interface CovariateProvenance {
    source?: string;
    detail?: string;
}
