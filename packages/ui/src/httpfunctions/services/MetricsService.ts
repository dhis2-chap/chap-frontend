/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MetricsService {
    /**
     * Get Metrics Csv
     * Download per-location / per-time_period / per-horizon metric values as a
     * long-format CSV. Every applicable metric in
     * `chap_core.assessment.metrics.available_metrics` is included as rows.
     *
     * Currently takes a single backtest via the `backtestId` query parameter; the
     * path is scoped to `/metric/` so it can be extended to accept multiple
     * evaluations later without a breaking change.
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getMetricsCsvV1CrudMetricCsvGet(
        backtestId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/metric/csv',
            query: {
                'backtestId': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
