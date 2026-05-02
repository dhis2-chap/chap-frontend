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
}

export interface LocalExplanationResponse {
    id?: number;
    predictionId: number;
    orgUnit: string;
    period: string;
    method: string;
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
    ): CancelablePromise<GlobalExplanationResponse> {
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
        });
    }

    public static computeGlobalExplanation(
        predictionId: number,
        topK: number = 10,
        outputStatistic?: string,
        xaiMethod?: string,
    ): CancelablePromise<GlobalExplanationResponse> {
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
        });
    }

    public static listLocalExplanations(
        predictionId: number,
        orgUnit?: string,
        period?: string,
        xaiMethod?: string,
    ): CancelablePromise<LocalExplanationResponse[]> {
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
        });
    }

    public static computeLocalExplanation(
        predictionId: number,
        requestBody: LocalExplanationRequest,
    ): CancelablePromise<LocalExplanationResponse> {
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
        });
    }

    public static getLocalExplanation(
        predictionId: number,
        explanationId: number,
    ): CancelablePromise<LocalExplanationResponse> {
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
        });
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
    ): CancelablePromise<ShapBeeswarmResponse> {
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
        });
    }

    public static computeHorizonSummary(
        predictionId: number,
        orgUnit: string,
        outputStatistic: string = 'median',
        method: string = 'shap',
        xaiMethod: string = DEFAULT_XAI_METHOD,
    ): CancelablePromise<HorizonSummaryResponse> {
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
        });
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
