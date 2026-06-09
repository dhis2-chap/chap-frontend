/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BacktestRead } from '../models/BacktestRead';
import type { chap_core__rest_api__v1__jobs__DataBaseResponse } from '../models/chap_core__rest_api__v1__jobs__DataBaseResponse';
import type { JobDescription } from '../models/JobDescription';
import type { PredictionInfo } from '../models/PredictionInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JobsService {
    /**
     * Track background work
     * See every backtest, prediction, or dataset-import job currently being tracked, so a UI can render a progress dashboard or a script can wait for a batch to finish.
     *
     * Optionally narrow the list by ``ids``, ``type`` (e.g. ``PREDICTION``, ``EVALUATION``),
     * ``predictionSetupId`` (every job a given setup has launched), and/or ``status``
     * (case-insensitive). Filters compose. An empty list just means nothing matched — no
     * 404.
     * @param ids
     * @param status
     * @param type
     * @param predictionSetupId
     * @returns JobDescription Successful Response
     * @throws ApiError
     */
    public static listJobsV1JobsGet(
        ids?: Array<string>,
        status?: Array<string>,
        type?: string,
        predictionSetupId?: (number | null),
    ): CancelablePromise<Array<JobDescription>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/jobs',
            query: {
                'ids': ids,
                'status': status,
                'type': type,
                'predictionSetupId': predictionSetupId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Check whether a job is done yet
     * Return the current state of a queued job (``PENDING``, ``STARTED``, ``SUCCESS``, ``FAILURE``, ...).
     *
     * The canonical way to poll a background job started by any of the
     * ``POST /v1/analytics*`` or ``POST /v1/crud*`` endpoints. 404 if the job id is
     * unknown.
     * @param jobId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getJobStatusV1JobsJobIdGet(
        jobId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/jobs/{job_id}',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Forget a finished job
     * Drop a finished or cancelled job from the tracker once you no longer need to see it in the listing.
     *
     * Cancel a running job via ``POST /{job_id}/cancel`` first; this endpoint refuses to
     * delete jobs that look ``pending``, ``started``, or ``running`` and returns 400 in
     * those cases.
     * @param jobId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteJobV1JobsJobIdDelete(
        jobId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/jobs/{job_id}',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stop a running job
     * Revoke a queued or in-flight job so the worker stops processing it — used when a user abandons a backtest creation flow or aborts a long-running prediction.
     *
     * Returns 400 if the job has already finished (``success`` / ``failure`` / ``revoked``)
     * or is in an unexpected state; 404 if the id is unknown.
     * @param jobId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static cancelJobV1JobsJobIdCancelPost(
        jobId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/jobs/{job_id}/cancel',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read a job's captured logs
     * Tail the log output the worker captured while running this job — useful for debugging a failure or watching progress.
     *
     * The response is the captured log text, or an empty string if the worker has not
     * written anything yet (for example because the job has not started). Returns 404
     * if the job id is unknown.
     * @param jobId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getLogsV1JobsJobIdLogsGet(
        jobId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/jobs/{job_id}/logs',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Fetch the prediction a finished forecast job produced
     * Get the prediction row a successful forecast job wrote, in one hop instead of polling for status then looking up the id by hand.
     *
     * Useful right after the job's status flips to ``SUCCESS``. 400 if the job is still
     * running or has failed; 404 if the job id or the resulting prediction is missing.
     * @param jobId
     * @returns PredictionInfo Successful Response
     * @throws ApiError
     */
    public static getPredictionResultV1JobsJobIdPredictionResultGet(
        jobId: string,
    ): CancelablePromise<PredictionInfo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/jobs/{job_id}/prediction_result',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Fetch the backtest a finished evaluation job produced
     * Get the backtest a successful evaluation job wrote, in one hop instead of polling for status then looking up the id by hand.
     *
     * Useful right after the job's status flips to ``SUCCESS``. 400 if the job is still
     * running or has failed; 404 if the job id or the resulting backtest is missing.
     * @param jobId
     * @returns BacktestRead Successful Response
     * @throws ApiError
     */
    public static getEvaluationResultV1JobsJobIdEvaluationResultGet(
        jobId: string,
    ): CancelablePromise<BacktestRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/jobs/{job_id}/evaluation_result',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Fetch the row id a generic finished job produced
     * Get the integer id a finished job wrote — used by job types whose only output is "a thing was created with id N" (most commonly dataset imports).
     *
     * Once you have the id, follow up with the appropriate CRUD endpoint to load the row.
     * 400 if the job is still running or has failed.
     * @param jobId
     * @returns chap_core__rest_api__v1__jobs__DataBaseResponse Successful Response
     * @throws ApiError
     */
    public static getDatabaseResultV1JobsJobIdDatabaseResultGet(
        jobId: string,
    ): CancelablePromise<chap_core__rest_api__v1__jobs__DataBaseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/jobs/{job_id}/database_result',
            path: {
                'job_id': jobId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
