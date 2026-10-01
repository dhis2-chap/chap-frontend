/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertPolicyCreate } from '../models/AlertPolicyCreate';
import type { AlertPolicyRead } from '../models/AlertPolicyRead';
import type { chap_core__rest_api__data_models__DataBaseResponse } from '../models/chap_core__rest_api__data_models__DataBaseResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AlertPoliciesService {
    /**
     * Browse saved alert policies
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * List every alert policy, so a UI can offer them when configuring a prediction setup.
     * @returns AlertPolicyRead Successful Response
     * @throws ApiError
     */
    public static listAlertPoliciesV1CrudAlertPoliciesGet(): CancelablePromise<Array<AlertPolicyRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/alert-policies',
        });
    }
    /**
     * Define the tiers at which forecasts raise alerts
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Create a named ladder of alert levels — a `monitor` tier, an `alert` tier, an `action` tier — that a prediction setup can be pointed at.
     *
     * Each level pairs an epidemic channel (the same strategy and parameters
     * `POST /v1/analytics/thresholds` takes, with a single threshold line) with the
     * exceedance probability at or above which that tier fires, so one policy expresses a
     * whole escalation ladder. Levels are ordered from least to most severe. 422 if the
     * policy has no levels, an unnamed level, a level with more than one threshold line,
     * or two levels sharing a name.
     * @param requestBody
     * @returns chap_core__rest_api__data_models__DataBaseResponse Successful Response
     * @throws ApiError
     */
    public static createAlertPolicyV1CrudAlertPoliciesPost(
        requestBody: AlertPolicyCreate,
    ): CancelablePromise<chap_core__rest_api__data_models__DataBaseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/alert-policies',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * View one alert policy and its levels
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Read a policy's levels, each with its channel parameters and the probability at which it fires. 404 if the id is unknown.
     * @param alertPolicyId
     * @returns AlertPolicyRead Successful Response
     * @throws ApiError
     */
    public static getAlertPolicyV1CrudAlertPoliciesAlertPolicyIdGet(
        alertPolicyId: number,
    ): CancelablePromise<AlertPolicyRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/alert-policies/{alertPolicyId}',
            path: {
                'alertPolicyId': alertPolicyId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove an alert policy
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Delete a policy no prediction setup points at.
     *
     * Refused with 409 while a setup still references it, so a running forecast cannot
     * lose the definition of what counts as an alert. 404 if the id is unknown.
     * @param alertPolicyId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteAlertPolicyV1CrudAlertPoliciesAlertPolicyIdDelete(
        alertPolicyId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/crud/alert-policies/{alertPolicyId}',
            path: {
                'alertPolicyId': alertPolicyId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
