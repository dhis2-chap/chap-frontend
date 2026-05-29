/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthResponse } from '../models/HealthResponse';
import type { SystemInfoResponse } from '../models/SystemInfoResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemService {
    /**
     * Health
     * Check that the API is running and healthy.
     * @returns HealthResponse Successful Response
     * @throws ApiError
     */
    public static healthHealthGet(): CancelablePromise<HealthResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * System Info
     * Return system information including versions.
     * @returns SystemInfoResponse Successful Response
     * @throws ApiError
     */
    public static systemInfoSystemInfoGet(): CancelablePromise<SystemInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system/info',
        });
    }
}
