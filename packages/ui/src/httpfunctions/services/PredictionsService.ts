/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JobResponse } from '../models/JobResponse';
import type { MakePredictionRequest } from '../models/MakePredictionRequest';
import type { PredictionEntry } from '../models/PredictionEntry';
import type { PredictionInfo } from '../models/PredictionInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PredictionsService {
    /**
     * Browse stored forecasts
     * List every prediction whose configured model row still exists in the database, so you can pick a forecast to inspect, plot, push back into DHIS2, or delete.
     *
     * Predictions whose configured model has been deleted outright are filtered out;
     * predictions whose configured model has only been archived (soft-deleted) still
     * appear, since the row is still resolvable.
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
     * View one forecast's metadata
     * Read the identifying information for a single prediction — the model and dataset behind it, when it ran, what periods it covers — without pulling the forecast values themselves.
     *
     * Use ``GET /v1/analytics/prediction-entry/{id}`` once you actually need quantiles to
     * plot. 404 if the id is unknown.
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
     * Remove a forecast
     * Permanently delete a prediction and every forecast row it contains. Use this to clean up obsolete or test forecasts from the listing. 404 if the id is unknown.
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
     * Read forecast quantiles for a prediction (query parameter id)
     * Pull the chosen quantiles (median, 10th and 90th percentile, ...) out of a prediction so they can be charted, exported, or fed back into DHIS2.
     *
     * Returns one entry per (period, region, quantile) tuple. Same response as
     * ``GET /v1/analytics/prediction-entry/{predictionId}`` — only the parameter style
     * differs; that variant takes the id in the path. 404 if the prediction id is unknown.
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
     * Run a one-off forecast from inline data
     * Run a forecast against observations supplied directly in the request body — no stored dataset needed.
     *
     * Use this for ad-hoc work when DHIS2 (or another source) already has the data and you
     * want it run through a configured model once. Forecasting happens in the background;
     * the response carries a job id you poll via ``/v1/jobs/{id}`` for the result. For a
     * recurring or scheduled version of the same workflow, use a prediction setup. The
     * legacy ``data_to_be_fetched`` field is rejected — supply the observations directly.
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
     * Read forecast quantiles for a prediction (path parameter id)
     * Path-parameter variant of ``GET /v1/analytics/prediction-entry`` for callers that prefer the id in the URL.
     *
     * Same forecast-quantile response — pick whichever URL shape your client tooling
     * handles more naturally. 404 if the prediction id is unknown.
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
