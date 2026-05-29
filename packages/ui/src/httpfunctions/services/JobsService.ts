/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataBaseResponse } from '../models/DataBaseResponse';
import type { EvaluationResponse } from '../models/EvaluationResponse';
import type { FullPredictionResponse } from '../models/FullPredictionResponse';
import type { JobDescription } from '../models/JobDescription';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JobsService {
    /**
     * List Jobs
     * List all jobs currently in the queue.
     * Optionally filters by a list of job IDs, a list of statuses, and/or a job type.
     * Filtering order: IDs, then type, then status.
     * @param ids
     * @param status
     * @param type
     * @returns JobDescription Successful Response
     * @throws ApiError
     */
    public static listJobsV1JobsGet(
        ids?: Array<string>,
        status?: Array<string>,
        type?: string,
    ): CancelablePromise<Array<JobDescription>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/jobs',
            query: {
                'ids': ids,
                'status': status,
                'type': type,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Job Status
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
     * Delete Job
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
     * Cancel Job
     * Cancel a running job
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
     * Get Logs
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
     * Get Prediction Result
     * @param jobId
     * @returns FullPredictionResponse Successful Response
     * @throws ApiError
     */
    public static getPredictionResultV1JobsJobIdPredictionResultGet(
        jobId: string,
    ): CancelablePromise<FullPredictionResponse> {
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
     * Get Evaluation Result
     * @param jobId
     * @returns EvaluationResponse Successful Response
     * @throws ApiError
     */
    public static getEvaluationResultV1JobsJobIdEvaluationResultGet(
        jobId: string,
    ): CancelablePromise<EvaluationResponse> {
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
     * Get Database Result
     * @param jobId
     * @returns DataBaseResponse Successful Response
     * @throws ApiError
     */
    public static getDatabaseResultV1JobsJobIdDatabaseResultGet(
        jobId: string,
    ): CancelablePromise<DataBaseResponse> {
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
