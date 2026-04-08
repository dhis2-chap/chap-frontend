/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PingResponse } from '../models/PingResponse';
import type { RegistrationRequest } from '../models/RegistrationRequest';
import type { RegistrationResponse } from '../models/RegistrationResponse';
import type { ServiceDetail } from '../models/ServiceDetail';
import type { ServiceListResponse } from '../models/ServiceListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ServicesService {
    /**
     * Register Service
     * Register a new service with the orchestrator.
     * @param requestBody
     * @param xServiceKey
     * @returns RegistrationResponse Successful Response
     * @throws ApiError
     */
    public static registerServiceV2ServicesRegisterPost(
        requestBody: RegistrationRequest,
        xServiceKey?: (string | null),
    ): CancelablePromise<RegistrationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v2/services/$register',
            headers: {
                'X-Service-Key': xServiceKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Ping Service
     * Send a keepalive ping for a registered service.
     * @param serviceId
     * @param xServiceKey
     * @returns PingResponse Successful Response
     * @throws ApiError
     */
    public static pingServiceV2ServicesServiceIdPingPut(
        serviceId: string,
        xServiceKey?: (string | null),
    ): CancelablePromise<PingResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/v2/services/{service_id}/$ping',
            path: {
                'service_id': serviceId,
            },
            headers: {
                'X-Service-Key': xServiceKey,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Services
     * List all registered services.
     * @returns ServiceListResponse Successful Response
     * @throws ApiError
     */
    public static listServicesV2ServicesGet(): CancelablePromise<ServiceListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v2/services',
        });
    }
    /**
     * Get Service
     * Get details of a specific registered service.
     * @param serviceId
     * @returns ServiceDetail Successful Response
     * @throws ApiError
     */
    public static getServiceV2ServicesServiceIdGet(
        serviceId: string,
    ): CancelablePromise<ServiceDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v2/services/{service_id}',
            path: {
                'service_id': serviceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Deregister Service
     * Deregister a service.
     * @param serviceId
     * @param xServiceKey
     * @returns void
     * @throws ApiError
     */
    public static deregisterServiceV2ServicesServiceIdDelete(
        serviceId: string,
        xServiceKey?: (string | null),
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v2/services/{service_id}',
            path: {
                'service_id': serviceId,
            },
            headers: {
                'X-Service-Key': xServiceKey,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
