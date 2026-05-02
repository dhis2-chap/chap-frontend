/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GlobalExplanationResponse } from '../models/GlobalExplanationResponse';
import type { HorizonSummaryResponse } from '../models/HorizonSummaryResponse';
import type { JobResponse } from '../models/JobResponse';
import type { LocalExplanationRequest } from '../models/LocalExplanationRequest';
import type { LocalExplanationResponse } from '../models/LocalExplanationResponse';
import type { RunExplanationsRequest } from '../models/RunExplanationsRequest';
import type { ShapBeeswarmResponse } from '../models/ShapBeeswarmResponse';
import type { XaiMethodRead } from '../models/XaiMethodRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class XaiService {
    /**
     * List Xai Methods
     * @param includeArchived
     * @param predictionId
     * @returns XaiMethodRead Successful Response
     * @throws ApiError
     */
    public static listXaiMethodsV1XaiMethodsGet(
        includeArchived: boolean = false,
        predictionId?: (number | null),
    ): CancelablePromise<Array<XaiMethodRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/methods',
            query: {
                'includeArchived': includeArchived,
                'predictionId': predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Xai Method
     * @param name
     * @returns XaiMethodRead Successful Response
     * @throws ApiError
     */
    public static getXaiMethodV1XaiMethodsNameGet(
        name: string,
    ): CancelablePromise<XaiMethodRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/methods/{name}',
            path: {
                'name': name,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run Explanations
     * @param predictionId
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static runExplanationsV1XaiPredictionsPredictionIdExplanationsRunPost(
        predictionId: number,
        requestBody: RunExplanationsRequest,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/explanations/run',
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
    /**
     * Get Global Explanation
     * @param predictionId
     * @param xaiMethod
     * @returns GlobalExplanationResponse Successful Response
     * @throws ApiError
     */
    public static getGlobalExplanationV1XaiPredictionsPredictionIdGlobalGet(
        predictionId: number,
        xaiMethod?: (string | null),
    ): CancelablePromise<GlobalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/predictions/{predictionId}/global',
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
    /**
     * Compute Global Explanation
     * @param predictionId
     * @param topK
     * @param outputStatistic
     * @param force
     * @param xaiMethod
     * @returns GlobalExplanationResponse Successful Response
     * @throws ApiError
     */
    public static computeGlobalExplanationV1XaiPredictionsPredictionIdGlobalPost(
        predictionId: number,
        topK: number = 10,
        outputStatistic: string = 'median',
        force: boolean = false,
        xaiMethod: string = 'shap_auto',
    ): CancelablePromise<GlobalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/global',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'topK': topK,
                'outputStatistic': outputStatistic,
                'force': force,
                'xaiMethod': xaiMethod,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Local Explanations
     * @param predictionId
     * @param orgUnit
     * @param period
     * @param xaiMethod
     * @returns LocalExplanationResponse Successful Response
     * @throws ApiError
     */
    public static listLocalExplanationsV1XaiPredictionsPredictionIdLocalGet(
        predictionId: number,
        orgUnit?: (string | null),
        period?: (string | null),
        xaiMethod?: (string | null),
    ): CancelablePromise<Array<LocalExplanationResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/predictions/{predictionId}/local',
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
    /**
     * Compute Local Explanation
     * @param predictionId
     * @param requestBody
     * @returns LocalExplanationResponse Successful Response
     * @throws ApiError
     */
    public static computeLocalExplanationV1XaiPredictionsPredictionIdLocalPost(
        predictionId: number,
        requestBody: LocalExplanationRequest,
    ): CancelablePromise<LocalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/local',
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
    /**
     * Compute Shap Beeswarm
     * @param predictionId
     * @param outputStatistic
     * @param xaiMethod
     * @returns ShapBeeswarmResponse Successful Response
     * @throws ApiError
     */
    public static computeShapBeeswarmV1XaiPredictionsPredictionIdShapBeeswarmPost(
        predictionId: number,
        outputStatistic: string = 'median',
        xaiMethod: string = 'shap_auto',
    ): CancelablePromise<ShapBeeswarmResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/shap-beeswarm',
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
    /**
     * Compute Horizon Summary
     * @param predictionId
     * @param orgUnit
     * @param outputStatistic
     * @param xaiMethod
     * @returns HorizonSummaryResponse Successful Response
     * @throws ApiError
     */
    public static computeHorizonSummaryV1XaiPredictionsPredictionIdLocalHorizonSummaryPost(
        predictionId: number,
        orgUnit: string,
        outputStatistic: string = 'median',
        xaiMethod: string = 'shap_auto',
    ): CancelablePromise<HorizonSummaryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/xai/predictions/{predictionId}/local/horizon-summary',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'orgUnit': orgUnit,
                'outputStatistic': outputStatistic,
                'xaiMethod': xaiMethod,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Local Explanation
     * @param predictionId
     * @param explanationId
     * @returns LocalExplanationResponse Successful Response
     * @throws ApiError
     */
    public static getLocalExplanationV1XaiPredictionsPredictionIdLocalExplanationIdGet(
        predictionId: number,
        explanationId: number,
    ): CancelablePromise<LocalExplanationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/xai/predictions/{predictionId}/local/{explanationId}',
            path: {
                'predictionId': predictionId,
                'explanationId': explanationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Local Explanation
     * @param predictionId
     * @param explanationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteLocalExplanationV1XaiPredictionsPredictionIdLocalExplanationIdDelete(
        predictionId: number,
        explanationId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/xai/predictions/{predictionId}/local/{explanationId}',
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
