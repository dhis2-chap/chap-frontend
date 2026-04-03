import type { CancelablePromise } from '../core/CancelablePromise';
import type { JobResponse } from '../models/JobResponse';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

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
    feature_name: string;
    importance: number;
    direction?: string;
    baseline_value?: number;
    actual_value?: number;
}

export interface DataSourceInfo {
    dataSourceType: 'observed' | 'seasonal_proxy' | 'last_available';
    targetPeriod: string;
    matchedPeriod: string;
    description: string;
}

export interface GlobalExplanationResponse {
    method: string;
    topFeatures: FeatureAttribution[];
    computedAt?: string;
    nSamples: number;
    stabilityScore?: number;
    available: boolean;
    surrogateQuality?: {
        rSquared: number;
        nSamples: number;
        nUniqueRows: number;
        constantFeatures: string[];
    };
}

export interface CovariateProvenance {
    source?: string;
    matchedPeriod?: string;
    aggregate?: string;
    targetYear?: number;
    calendarMonth?: number;
    isoWeek?: number;
    nRowsAveraged?: number;
    yearsUsed?: number[];
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
    surrogateQuality?: {
        rSquared: number;
        nSamples: number;
        nUniqueRows: number;
        constantFeatures: string[];
    };
    covariateProvenance?: CovariateProvenance;
    dataSource?: DataSourceInfo;
}

export interface HorizonStepSummary {
    period: string;
    targetPeriod: string;
    forecastStep: number;
    dataSource?: DataSourceInfo;
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
    surrogateQuality?: {
        rSquared: number;
        nSamples: number;
        nUniqueRows: number;
        constantFeatures: string[];
    };
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
    surrogateQuality?: {
        rSquared: number;
        nSamples: number;
        nUniqueRows: number;
        constantFeatures: string[];
    };
}

export class XaiService {
    public static listXaiMethods(
        includeArchived: boolean = false,
    ): CancelablePromise<XaiMethodRead[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/xai/methods',
            query: {
                'includeArchived': includeArchived,
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
            url: '/xai/methods/{name}',
            path: {
                'name': name,
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
            url: '/xai/predictions/{predictionId}/global',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'xaiMethod': xaiMethod,
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
            url: '/xai/predictions/{predictionId}/global',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'topK': topK,
                'outputStatistic': outputStatistic,
                'xaiMethod': xaiMethod,
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
            url: '/xai/predictions/{predictionId}/local',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'orgUnit': orgUnit,
                'period': period,
                'xaiMethod': xaiMethod,
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

    public static computeShapBeeswarm(
        predictionId: number,
        outputStatistic: string = 'median',
        xaiMethod: string = DEFAULT_XAI_METHOD,
    ): CancelablePromise<ShapBeeswarmResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/xai/predictions/{predictionId}/shap-beeswarm',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'outputStatistic': outputStatistic,
                'xaiMethod': xaiMethod,
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
            url: '/xai/predictions/{predictionId}/local/horizon-summary',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'orgUnit': orgUnit,
                'outputStatistic': outputStatistic,
                'method': method,
                'xaiMethod': xaiMethod,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    public static runExplanations(
        predictionId: number,
        xaiMethodName: string = DEFAULT_XAI_METHOD,
        outputStatistic: string = 'median',
        topK: number = 10,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/xai/predictions/{predictionId}/explanations/run',
            path: {
                'predictionId': predictionId,
            },
            body: {
                xaiMethodName,
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
