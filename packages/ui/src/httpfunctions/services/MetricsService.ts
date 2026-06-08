/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MetricsService {
    /**
     * Export backtest metrics for offline analysis
     * Download every scoring metric computed for a backtest as a CSV, broken down by region, time period, and forecast horizon.
     *
     * Use this when you want to pull metrics into pandas, Excel, or BI tooling for
     * analysis the built-in plots don't cover — for example comparing several backtests
     * side by side, or weighting locations differently. The path is scoped to ``/metric/``
     * so it can be extended to multi-backtest exports later without breaking callers.
     * 404 if the backtest is unknown.
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
