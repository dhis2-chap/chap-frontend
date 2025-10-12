/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Metric } from '../models/Metric';
import type { VisualizationInfo } from '../models/VisualizationInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VisualizationService {
    /**
     * List Visualizations
     * List available visualizations
     * @param backtestId
     * @returns VisualizationInfo Successful Response
     * @throws ApiError
     */
    public static listVisualizationsVisualizationBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<VisualizationInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/visualization/{backtest_id}',
            path: {
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Available Metrics
     * @param backtestId
     * @returns Metric Successful Response
     * @throws ApiError
     */
    public static getAvailableMetricsVisualizationMetricsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<Metric>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/visualization/metrics/{backtest_id}',
            path: {
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Visualization
     * @param visualizationName
     * @param backtestId
     * @param metricId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateVisualizationVisualizationVisualizationNameBacktestIdMetricIdGet(
        visualizationName: string,
        backtestId: number,
        metricId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/visualization/{visualization_name}/{backtest_id}/{metric_id}',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
                'metric_id': metricId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
