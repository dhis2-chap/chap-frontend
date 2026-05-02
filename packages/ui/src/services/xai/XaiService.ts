/**
 * Hand-written XAI client.
 *
 * TEMPORARY: these endpoints are not yet exposed by the backend OpenAPI spec, so
 * they cannot be produced by `pnpm generate`. Once the backend includes the
 * /v1/xai/** routes in its OpenAPI document, delete this file and re-run the
 * generator — the generated XaiService will replace it. Until then, keep this
 * file in sync with the backend manually (see apps/modeling-app/docs/xai_api.md).
 */
import type { CancelablePromise } from '../../httpfunctions/core/CancelablePromise';
import type { JobResponse } from '../../httpfunctions/models/JobResponse';
import type { MakePredictionRequest } from '../../httpfunctions/models/MakePredictionRequest';
import { OpenAPI } from '../../httpfunctions/core/OpenAPI';
import { request as __request } from '../../httpfunctions/core/request';

/**
 * MakePredictionRequest extended with XAI-only fields. The backend accepts these
 * but they are not yet in the OpenAPI spec; remove this type once the generated
 * MakePredictionRequest includes them.
 */
export type MakePredictionRequestWithXai = MakePredictionRequest & {
    /** When true, automatically train an XAI surrogate model after the prediction completes. */
    enableXai?: boolean;
    /** Name of the XAI method to use for surrogate training (e.g. "shap_auto"). */
    xaiMethodName?: string;
};

export const DEFAULT_XAI_METHOD = 'shap_auto';

export interface XaiMethodRead {
    id: number;
    name: string;
    displayName: string;
    description: string;
    methodType: string;
    sourceUrl?: string;
    author: string;
    archived: boolean;
    /** Plot types this method supports, e.g. ["importance", "waterfall", "beeswarm"]. */
    supportedVisualizations: string[];
}

export interface FeatureAttribution {
    featureName: string;
    importance: number;
    direction?: string;
    baselineValue?: number;
    actualValue?: number;
}

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

export interface GlobalExplanationResponse {
    method: string;
    topFeatures: FeatureAttribution[];
    computedAt?: string;
    nSamples: number;
    stabilityScore?: number;
    available: boolean;
    surrogateQuality?: SurrogateQuality;
}

export const COVARIATE_SOURCE_DATASET_MATCH = 'dataset_match';

export interface CovariateProvenance {
    source?: string;
    detail?: string;
}

export interface LocalExplanationRequest {
    orgUnit: string;
    period: string;
    outputStatistic?: string;
    method?: string;
    xaiMethod?: string;
    topK?: number;
    force?: boolean;
    includeInteractions?: boolean;
}

export interface LocalExplanationResponse {
    id?: number;
    predictionId: number;
    orgUnit: string;
    period: string;
    method: string;
    xaiMethodName?: string;
    outputStatistic: string;
    featureAttributions: FeatureAttribution[];
    baselinePrediction: number;
    actualPrediction: number;
    computedAt?: string;
    status: string;
    surrogateQuality?: SurrogateQuality;
    covariateProvenance?: CovariateProvenance;
}

export interface HorizonStepSummary {
    period: string;
    targetPeriod: string;
    forecastStep: number;
    featureImportances: {
        featureName: string;
        importance: number;
        direction: string;
    }[];
    actualPrediction?: number;
}

export interface HorizonSummaryResponse {
    predictionId: number;
    orgUnit: string;
    method: string;
    outputStatistic: string;
    steps: HorizonStepSummary[];
    averageImportance: {
        featureName: string;
        meanAbsImportance: number;
        meanSignedImportance: number;
        direction: string;
    }[];
    surrogateQuality?: SurrogateQuality;
}

export interface ShapBeeswarmPoint {
    featureName: string;
    shapValue: number;
    featureValue: number;
    orgUnit: string;
    period: string;
}

export interface ShapBeeswarmResponse {
    predictionId: number;
    outputStatistic: string;
    featureNames: string[];
    points: ShapBeeswarmPoint[];
    surrogateQuality?: SurrogateQuality;
}

function normalizeSurrogateQuality(q: any): SurrogateQuality {
    return {
        rSquared: q.rSquared ?? q.r_squared,
        mae: q.mae,
        mape: q.mape,
        nSamples: q.nSamples ?? q.n_samples,
        nUniqueRows: q.nUniqueRows ?? q.n_unique_rows,
        constantFeatures: q.constantFeatures ?? q.constant_features,
        permutationRemovedFeatures: q.permutationRemovedFeatures ?? q.permutation_removed_features,
        residualMean: q.residualMean ?? q.residual_mean,
        residualStd: q.residualStd ?? q.residual_std,
        fidelityTier: q.fidelityTier ?? q.fidelity_tier,
        targetTransformMethod: q.targetTransformMethod ?? q.target_transform_method,
        selectedModelDisplayName: q.selectedModelDisplayName ?? q.selected_model_display_name,
    };
}

function normalizeGlobalExplanation(r: any): GlobalExplanationResponse {
    return {
        ...r,
        surrogateQuality: (r.surrogateQuality || r.surrogate_quality)
            ? normalizeSurrogateQuality(r.surrogateQuality ?? r.surrogate_quality)
            : undefined,
    };
}

function normalizeLocalExplanation(r: any): LocalExplanationResponse {
    return {
        id: r.id,
        predictionId: r.predictionId ?? r.prediction_id,
        orgUnit: r.orgUnit ?? r.org_unit,
        period: r.period,
        method: r.method,
        xaiMethodName: r.xaiMethodName ?? r.xai_method_name,
        outputStatistic: r.outputStatistic ?? r.output_statistic,
        featureAttributions: r.featureAttributions ?? r.feature_attributions ?? [],
        baselinePrediction: r.baselinePrediction ?? r.baseline_prediction,
        actualPrediction: r.actualPrediction ?? r.actual_prediction,
        computedAt: r.computedAt ?? r.computed_at,
        status: r.status,
        covariateProvenance: r.covariateProvenance ?? r.covariate_provenance,
        surrogateQuality: (r.surrogateQuality || r.surrogate_quality)
            ? normalizeSurrogateQuality(r.surrogateQuality ?? r.surrogate_quality)
            : undefined,
    };
}

function normalizeShapBeeswarmPoint(p: any): ShapBeeswarmPoint {
    return {
        featureName: p.featureName ?? p.feature_name,
        shapValue: p.shapValue ?? p.shap_value,
        featureValue: p.featureValue ?? p.feature_value,
        orgUnit: p.orgUnit ?? p.org_unit,
        period: p.period,
    };
}

function normalizeShapBeeswarmResponse(r: any): ShapBeeswarmResponse {
    return {
        predictionId: r.predictionId ?? r.prediction_id,
        outputStatistic: r.outputStatistic ?? r.output_statistic,
        featureNames: r.featureNames ?? r.feature_names ?? [],
        points: (r.points ?? []).map(normalizeShapBeeswarmPoint),
        surrogateQuality: (r.surrogateQuality || r.surrogate_quality)
            ? normalizeSurrogateQuality(r.surrogateQuality ?? r.surrogate_quality)
            : undefined,
    };
}

function normalizeHorizonSummary(r: any): HorizonSummaryResponse {
    return {
        ...r,
        surrogateQuality: (r.surrogateQuality || r.surrogate_quality)
            ? normalizeSurrogateQuality(r.surrogateQuality ?? r.surrogate_quality)
            : undefined,
    };
}

export class XaiService {
    public static listXaiMethods(
        includeArchived: boolean = false,
        predictionId?: number,
    ): CancelablePromise<XaiMethodRead[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/methods',
            query: {
                includeArchived: includeArchived,
                predictionId: predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    public static getXaiMethod(
        name: string,
    ): CancelablePromise<XaiMethodRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/methods/{name}',
            path: {
                name: name,
            },
            errors: {
                422: `Validation Error`,
                404: `Not Found`,
            },
        });
    }

    public static getGlobalExplanation(
        predictionId: number,
        xaiMethod?: string,
    ): Promise<GlobalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/predictions/{predictionId}/global',
            path: {
                predictionId: predictionId,
            },
            query: {
                xaiMethod: xaiMethod,
            },
            errors: {
                422: `Validation Error`,
            },
        }).then(normalizeGlobalExplanation);
    }

    public static computeGlobalExplanation(
        predictionId: number,
        topK: number = 10,
        outputStatistic?: string,
        xaiMethod?: string,
    ): Promise<GlobalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/global',
            path: {
                predictionId: predictionId,
            },
            query: {
                topK: topK,
                outputStatistic: outputStatistic,
                xaiMethod: xaiMethod,
            },
            errors: {
                422: `Validation Error`,
            },
        }).then(normalizeGlobalExplanation);
    }

    public static listLocalExplanations(
        predictionId: number,
        orgUnit?: string,
        period?: string,
        xaiMethod?: string,
    ): Promise<LocalExplanationResponse[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/predictions/{predictionId}/local',
            path: {
                predictionId: predictionId,
            },
            query: {
                orgUnit: orgUnit,
                period: period,
                xaiMethod: xaiMethod,
            },
            errors: {
                422: `Validation Error`,
            },
        }).then(items => (items as any[]).map(normalizeLocalExplanation));
    }

    public static computeLocalExplanation(
        predictionId: number,
        requestBody: LocalExplanationRequest,
    ): Promise<LocalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/local',
            path: {
                predictionId: predictionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        }).then(normalizeLocalExplanation);
    }

    public static getLocalExplanation(
        predictionId: number,
        explanationId: number,
    ): Promise<LocalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/predictions/{predictionId}/local/{explanationId}',
            path: {
                predictionId: predictionId,
                explanationId: explanationId,
            },
            errors: {
                422: `Validation Error`,
            },
        }).then(normalizeLocalExplanation);
    }

    public static deleteLocalExplanation(
        predictionId: number,
        explanationId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/xai/predictions/{predictionId}/local/{explanationId}',
            path: {
                predictionId: predictionId,
                explanationId: explanationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    public static computeShapBeeswarm(
        predictionId: number,
        outputStatistic: string = 'median',
        xaiMethod: string = DEFAULT_XAI_METHOD,
    ): Promise<ShapBeeswarmResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/shap-beeswarm',
            path: {
                predictionId: predictionId,
            },
            query: {
                outputStatistic: outputStatistic,
                xaiMethod: xaiMethod,
            },
            errors: {
                422: `Validation Error`,
            },
        }).then(normalizeShapBeeswarmResponse);
    }

    public static computeHorizonSummary(
        predictionId: number,
        orgUnit: string,
        outputStatistic: string = 'median',
        method: string = 'shap',
        xaiMethod: string = DEFAULT_XAI_METHOD,
    ): Promise<HorizonSummaryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/local/horizon-summary',
            path: {
                predictionId: predictionId,
            },
            query: {
                orgUnit: orgUnit,
                outputStatistic: outputStatistic,
                method: method,
                xaiMethod: xaiMethod,
            },
            errors: {
                422: `Validation Error`,
            },
        }).then(normalizeHorizonSummary);
    }

    public static runExplanations(
        predictionId: number,
        xaiMethod: string = DEFAULT_XAI_METHOD,
        outputStatistic: string = 'median',
        topK: number = 10,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/explanations/run',
            path: {
                predictionId: predictionId,
            },
            body: {
                xaiMethod,
                outputStatistic,
                topK,
            },
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
