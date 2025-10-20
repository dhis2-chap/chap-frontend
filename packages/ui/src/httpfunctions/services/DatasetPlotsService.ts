/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DatasetPlotsService {
    /**
     * Generate Data Plots
     * @param visualizationName
     * @param datasetId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateDataPlotsPlotsDatasetVisualizationNameDatasetIdGet(
        visualizationName: string,
        datasetId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/plots/dataset/{visualization_name}/{dataset_id}',
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
     * Generate Backtest Plots
     * @param visualizationName
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateBacktestPlotsPlotsBacktestVisualizationNameBacktestIdGet(
        visualizationName: string,
        backtestId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/plots/backtest/{visualization_name}/{backtest_id}',
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
