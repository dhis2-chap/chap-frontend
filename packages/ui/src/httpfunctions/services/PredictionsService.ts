/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JobResponse } from '../models/JobResponse';
import type { MakePredictionRequest } from '../models/MakePredictionRequest';
import type { PredictionCreate } from '../models/PredictionCreate';
import type { PredictionEntry } from '../models/PredictionEntry';
import type { PredictionInfo } from '../models/PredictionInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PredictionsService {
    /**
     * Get Predictions
     * @returns PredictionInfo Successful Response
     * @throws ApiError
     */
    public static getPredictionsV1CrudPredictionsGet(): CancelablePromise<Array<PredictionInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/predictions',
        });
    }
    /**
     * Create Prediction
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static createPredictionV1CrudPredictionsPost(
        requestBody: PredictionCreate,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/predictions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Prediction
     * @param predictionId
     * @returns PredictionInfo Successful Response
     * @throws ApiError
     */
    public static getPredictionV1CrudPredictionsPredictionIdGet(
        predictionId: number,
    ): CancelablePromise<PredictionInfo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/predictions/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Prediction
     * @param predictionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deletePredictionV1CrudPredictionsPredictionIdDelete(
        predictionId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/crud/predictions/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Prediction Entry
     * return
     * @param predictionId
     * @param quantiles
     * @returns PredictionEntry Successful Response
     * @throws ApiError
     */
    public static getPredictionEntryV1AnalyticsPredictionEntryGet(
        predictionId: number,
        quantiles: Array<number>,
    ): CancelablePromise<Array<PredictionEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/prediction-entry',
            query: {
                'predictionId': predictionId,
                'quantiles': quantiles,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Make Prediction
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static makePredictionV1AnalyticsMakePredictionPost(
        requestBody: MakePredictionRequest,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/analytics/make-prediction',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Prediction Entries
     * @param predictionId
     * @param quantiles
     * @returns PredictionEntry Successful Response
     * @throws ApiError
     */
    public static getPredictionEntriesV1AnalyticsPredictionEntryPredictionIdGet(
        predictionId: number,
        quantiles: Array<number>,
    ): CancelablePromise<Array<PredictionEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/prediction-entry/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'quantiles': quantiles,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
