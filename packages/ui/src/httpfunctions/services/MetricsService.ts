/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataDimension } from '../models/DataDimension';
import type { OutbreakMetricInfo } from '../models/OutbreakMetricInfo';
import type { OutbreakMetricsResponse } from '../models/OutbreakMetricsResponse';
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
    /**
     * Discover which outbreak metrics are available
     * List the registered outbreak metrics, binary ones (per alert level) and categorical ones (per policy).
     *
     * The ids are the keys the metrics are reported under by
     * `GET /v1/analytics/backtests/{backtestId}/outbreak-metrics`.
     * @returns OutbreakMetricInfo Successful Response
     * @throws ApiError
     */
    public static listOutbreakMetricsV1AnalyticsOutbreakMetricsGet(): CancelablePromise<Array<OutbreakMetricInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/outbreak-metrics',
        });
    }
    /**
     * Score a backtest's outbreak alerts against an alert policy
     * Judge how well a backtest's forecasts would have raised the alerts of an alert policy.
     *
     * Each level's threshold is computed by its strategy, as in `POST /v1/analytics/thresholds`.
     * A cell (location, period, horizon) is an outbreak at a level when observed cases exceed
     * the threshold, and is alerted when the share of forecast samples above it reaches the
     * level's `exceedanceThreshold`. Every level gets the binary metrics; the levels together
     * get the categorical metrics on the most severe level breached. See
     * `GET /v1/analytics/outbreak-metrics` for the metrics.
     *
     * `groupBy` (repeatable: `location`, `time_period`, `horizon_distance`) splits the cells
     * into one row per group; without it every cell is pooled into one row.
     *
     * Thresholds are computed from the backtest's whole dataset by default. With
     * `baselineBeforeFirstSplit`, only observations before the first forecast period are used,
     * so the scored periods cannot raise their own threshold. 404 if the backtest or policy
     * is unknown; 400 if the policy has no levels or no threshold can be computed.
     * @param backtestId
     * @param alertPolicyId
     * @param groupBy
     * @param baselineBeforeFirstSplit
     * @returns OutbreakMetricsResponse Successful Response
     * @throws ApiError
     */
    public static getOutbreakMetricsV1AnalyticsBacktestsBacktestIdOutbreakMetricsGet(
        backtestId: number,
        alertPolicyId: number,
        groupBy?: (Array<DataDimension> | null),
        baselineBeforeFirstSplit: boolean = false,
    ): CancelablePromise<OutbreakMetricsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/backtests/{backtestId}/outbreak-metrics',
            path: {
                'backtestId': backtestId,
            },
            query: {
                'alertPolicyId': alertPolicyId,
                'groupBy': groupBy,
                'baselineBeforeFirstSplit': baselineBeforeFirstSplit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
