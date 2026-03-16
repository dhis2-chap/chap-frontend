/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DebugEntry } from '../models/DebugEntry';
import type { JobResponse } from '../models/JobResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DebugService {
    /**
     * Debug Entry
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static debugEntryV1CrudDebugPost(): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/debug',
        });
    }
    /**
     * Get Debug Entry
     * @param debugId
     * @returns DebugEntry Successful Response
     * @throws ApiError
     */
    public static getDebugEntryV1CrudDebugDebugIdGet(
        debugId: number,
    ): CancelablePromise<DebugEntry> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/debug/{debugId}',
            path: {
                'debugId': debugId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
