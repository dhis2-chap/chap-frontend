/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataBaseResponse } from '../models/DataBaseResponse';
import type { JobResponse } from '../models/JobResponse';
import type { PredictionSetupCreate } from '../models/PredictionSetupCreate';
import type { PredictionSetupRead } from '../models/PredictionSetupRead';
import type { PredictionSetupReadWithPredictions } from '../models/PredictionSetupReadWithPredictions';
import type { PredictionSetupUpdate } from '../models/PredictionSetupUpdate';
import type { RunPredictionSetupRequest } from '../models/RunPredictionSetupRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PredictionSetupsService {
    /**
     * List Prediction Setups
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     * @returns PredictionSetupRead Successful Response
     * @throws ApiError
     */
    public static listPredictionSetupsV1CrudPredictionSetupsGet(): CancelablePromise<Array<PredictionSetupRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/prediction-setups',
        });
    }
    /**
     * Create Prediction Setup
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     * @param requestBody
     * @returns DataBaseResponse Successful Response
     * @throws ApiError
     */
    public static createPredictionSetupV1CrudPredictionSetupsPost(
        requestBody: PredictionSetupCreate,
    ): CancelablePromise<DataBaseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/prediction-setups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Prediction Setup
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     * @param predictionSetupId
     * @returns PredictionSetupReadWithPredictions Successful Response
     * @throws ApiError
     */
    public static getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet(
        predictionSetupId: number,
    ): CancelablePromise<PredictionSetupReadWithPredictions> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/prediction-setups/{predictionSetupId}',
            path: {
                'predictionSetupId': predictionSetupId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Prediction Setup
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     * @param predictionSetupId
     * @param requestBody
     * @returns PredictionSetupRead Successful Response
     * @throws ApiError
     */
    public static updatePredictionSetupV1CrudPredictionSetupsPredictionSetupIdPatch(
        predictionSetupId: number,
        requestBody: PredictionSetupUpdate,
    ): CancelablePromise<PredictionSetupRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/crud/prediction-setups/{predictionSetupId}',
            path: {
                'predictionSetupId': predictionSetupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Prediction Setup
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     * @param predictionSetupId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deletePredictionSetupV1CrudPredictionSetupsPredictionSetupIdDelete(
        predictionSetupId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/crud/prediction-setups/{predictionSetupId}',
            path: {
                'predictionSetupId': predictionSetupId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run Prediction Setup
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     * @param predictionSetupId
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static runPredictionSetupV1CrudPredictionSetupsPredictionSetupIdRunPost(
        predictionSetupId: number,
        requestBody: RunPredictionSetupRequest,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/prediction-setups/{predictionSetupId}/run',
            path: {
                'predictionSetupId': predictionSetupId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
