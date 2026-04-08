/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackTestPlotType } from '../models/BackTestPlotType';
import type { DatasetPlotType } from '../models/DatasetPlotType';
import type { MetricInfo } from '../models/MetricInfo';
import type { VisualizationInfo } from '../models/VisualizationInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VisualizationsService {
    /**
     * Get Avilable Metric Plots
     * List available visualizations
     * @param backtestId
     * @returns VisualizationInfo Successful Response
     * @throws ApiError
     */
    public static getAvilableMetricPlotsV1VisualizationMetricPlotsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<VisualizationInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/metric-plots/{backtest_id}',
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
     * List available metrics for visualization.
     *
     * All metrics support detailed level visualization.
     * @param backtestId
     * @returns MetricInfo Successful Response
     * @throws ApiError
     */
    public static getAvailableMetricsV1VisualizationMetricsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<MetricInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/metrics/{backtest_id}',
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
    public static generateVisualizationV1VisualizationMetricPlotsVisualizationNameBacktestIdMetricIdGet(
        visualizationName: string,
        backtestId: number,
        metricId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/metric-plots/{visualization_name}/{backtest_id}/{metric_id}',
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
    /**
     * List Dataset Plot Types
     * @returns DatasetPlotType Successful Response
     * @throws ApiError
     */
    public static listDatasetPlotTypesV1VisualizationDatasetPlotsGet(): CancelablePromise<Array<DatasetPlotType>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/dataset-plots/',
        });
    }
    /**
     * Generate Data Plots
     * @param visualizationName
     * @param datasetId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateDataPlotsV1VisualizationDatasetPlotsVisualizationNameDatasetIdGet(
        visualizationName: string,
        datasetId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/dataset-plots/{visualization_name}/{dataset_id}',
            path: {
                'visualization_name': visualizationName,
                'dataset_id': datasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Backtest Plot Types
     * @returns BackTestPlotType Successful Response
     * @throws ApiError
     */
    public static listBacktestPlotTypesV1VisualizationBacktestPlotsGet(): CancelablePromise<Array<BackTestPlotType>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/backtest-plots/',
        });
    }
    /**
     * Generate Backtest Plots
     * @param visualizationName
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateBacktestPlotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdGet(
        visualizationName: string,
        backtestId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/backtest-plots/{visualization_name}/{backtest_id}',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
