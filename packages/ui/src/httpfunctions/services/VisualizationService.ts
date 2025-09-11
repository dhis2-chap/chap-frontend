/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VisualizationService {
    /**
     * List Visualizations
     * List available visualizations
     * @returns string Successful Response
     * @throws ApiError
     */
    public static listVisualizationsVisualizationGet(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/visualization/',
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
