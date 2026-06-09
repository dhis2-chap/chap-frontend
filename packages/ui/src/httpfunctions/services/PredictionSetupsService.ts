/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { chap_core__rest_api__data_models__DataBaseResponse } from '../models/chap_core__rest_api__data_models__DataBaseResponse';
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
     * Browse saved prediction setups
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * List every prediction setup so you can manage them, run them ad-hoc, or check which backtests have been promoted into a recurring forecast.
     *
     * Lightweight listing: each entry carries the setup's schedule, target backtest, and
     * quantile config, but not the predictions it has produced. Fetch a single setup by
     * id to get those.
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
     * Promote a backtest into a reusable prediction config
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Save a backtest as a prediction setup — a named configuration you can rerun on fresh data, either ad-hoc via ``/run`` or on a cron schedule.
     *
     * Use this after evaluating a model on historical data and deciding it's good enough
     * to operationalise. A backtest can back at most one setup (1-to-1 link). 404 if the
     * backtest is missing, 409 if it already has a setup, 422 if the cron expression or
     * quantile targets are malformed.
     * @param requestBody
     * @returns chap_core__rest_api__data_models__DataBaseResponse Successful Response
     * @throws ApiError
     */
    public static createPredictionSetupV1CrudPredictionSetupsPost(
        requestBody: PredictionSetupCreate,
    ): CancelablePromise<chap_core__rest_api__data_models__DataBaseResponse> {
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
     * View a prediction setup with its forecast history
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Read a setup's configuration alongside every prediction it has produced, so a UI can show "what does this setup do" and "what has it actually forecast" on the same page.
     *
     * 404 if the id is unknown.
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
     * Tweak a prediction setup's schedule or targets
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Adjust a setup without recreating it — pause or resume the schedule, change the cron expression, swap quantile targets, rename it.
     *
     * Only the fields you actually send are touched, so partial updates are safe. 404 if
     * the id is unknown, 422 if the new values are malformed.
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
     * Retire a prediction setup
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Stop a setup from ever running again — cancels any in-flight jobs it has launched, then removes the setup row.
     *
     * Use this when a forecast workflow is being decommissioned. Cancellation of running
     * jobs is essential here: a still-running job would otherwise try to write a
     * foreign-key link to a deleted setup and crash. 404 if the id is unknown; 503 if
     * Redis is unreachable (we can't safely cancel jobs in that case so the delete is
     * refused).
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
     * Run a prediction setup against fresh observations
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Run a forecast from a saved setup using observations supplied directly in the request body — the manual equivalent of what the cron schedule does automatically.
     *
     * Use this when you want to forecast ahead of the schedule (a new data drop has
     * arrived, a model investigation, etc.). Returns a job id; track it via
     * ``/v1/jobs/{id}`` or filter the jobs list with ``predictionSetupId`` to see every
     * job this setup has launched. Returns 404 if the setup is unknown, 409 if its
     * configured model has been archived, 422 if ``provided_data`` is empty.
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
