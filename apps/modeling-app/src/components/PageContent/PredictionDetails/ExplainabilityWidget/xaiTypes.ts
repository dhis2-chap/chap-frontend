export const DEFAULT_XAI_METHOD = 'shap_auto';

export const COVARIATE_SOURCE_DATASET_MATCH = 'dataset_match';

export type FidelityTier = 'good' | 'moderate' | 'poor';

export type SurrogateQuality = {
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
};

export type CovariateProvenance = {
    source?: string;
    detail?: string;
};

// The OpenAPI generator types these fields as `Record<string, any>` (or null).
// Until the backend exposes proper schemas for SurrogateQuality and
// CovariateProvenance, centralize the cast here so call sites stay clean.
export const toSurrogateQuality = (raw: unknown): SurrogateQuality | undefined =>
    (raw ?? undefined) as SurrogateQuality | undefined;

export const toCovariateProvenance = (raw: unknown): CovariateProvenance | undefined =>
    (raw ?? undefined) as CovariateProvenance | undefined;
