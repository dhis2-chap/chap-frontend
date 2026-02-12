import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface FeatureAttribution {
    feature_name: string;
    importance: number;
    direction?: string;
    baseline_value?: number;
    actual_value?: number;
}

export interface GlobalExplanationResponse {
    method: string;
    topFeatures: FeatureAttribution[];
    computedAt?: string;
    nSamples: number;
    stabilityScore?: number;
    available: boolean;
}

export interface LocalExplanationRequest {
    orgUnit: string;
    period: string;
    outputStatistic?: string;
    method?: string;
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
}

export class XaiService {
    public static getGlobalExplanation(
        predictionId: number,
    ): CancelablePromise<GlobalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/xai/predictions/{predictionId}/global',
            path: {
                'predictionId': predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    public static computeGlobalExplanation(
        predictionId: number,
        topK: number = 10,
    ): CancelablePromise<GlobalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/xai/predictions/{predictionId}/global',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'topK': topK,
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
    ): CancelablePromise<LocalExplanationResponse[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/xai/predictions/{predictionId}/local',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'orgUnit': orgUnit,
                'period': period,
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
            url: '/xai/predictions/{predictionId}/local',
            path: {
                'predictionId': predictionId,
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
            url: '/xai/predictions/{predictionId}/local/{explanationId}',
            path: {
                'predictionId': predictionId,
                'explanationId': explanationId,
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
            url: '/xai/predictions/{predictionId}/local/{explanationId}',
            path: {
                'predictionId': predictionId,
                'explanationId': explanationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
