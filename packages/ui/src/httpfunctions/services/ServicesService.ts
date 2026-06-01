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
     * Onboard a CHAPKit model service
     * Announce a CHAPKit-hosted model service so CHAP Core can route work to it.
     *
     * The orchestrator records the service and returns the absolute ping URL the service
     * must hit periodically to stay live. As a side effect, the service's templates and
     * default configurations are eagerly pulled into the v1 CRUD tables, so backtests and
     * predictions can target it without waiting for the next lazy sync. Requires the
     * ``X-Service-Key`` header.
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
     * Send a keepalive heartbeat for a service
     * Tell the orchestrator the service is still alive so it is not evicted from the registry.
     *
     * Called by the CHAPKit service itself on a timer — typically once a minute. The
     * orchestrator marks the service "live", which is what surfaces as
     * ``health_status = "live"`` on its model templates. Requires the ``X-Service-Key``
     * header. Returns 404 if the service id is unknown.
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
     * Browse currently live model services
     * List every CHAPKit model service currently registered, so operators can see at a glance what compute is available to route work to.
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
     * Inspect one registered service
     * Look up everything the orchestrator knows about a single service — its declared info, the URL it is reachable at, and when it last pinged.
     *
     * Used to diagnose registration issues or populate a service-detail panel. Returns
     * 404 if the service id is unknown.
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
     * Off-board a model service
     * Remove a service from the registry — used by the service itself on graceful shutdown, or by an operator forcing eviction.
     *
     * Templates produced by the service stay in the database (so historical backtests
     * still resolve) but lose their ``health_status = "live"`` marker. Requires the
     * ``X-Service-Key`` header. Returns 204 on success and 404 if the service id is
     * unknown.
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
