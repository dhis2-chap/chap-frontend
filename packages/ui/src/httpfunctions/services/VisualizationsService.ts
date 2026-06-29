/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BacktestPlotType } from '../models/BacktestPlotType';
import type { DatasetPlotType } from '../models/DatasetPlotType';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VisualizationsService {
    /**
     * Discover which dataset plots are available
     * List the visualizations you can render against an imported dataset (observation time-series per region, polygon overlays, ...).
     *
     * Use this to populate a plot picker before requesting a specific
     * ``/dataset-plots/{name}/{datasetId}`` URL.
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
     * Render a plot of a dataset
     * Render the chosen visualization for a dataset — used to inspect observations before training, spot gaps in the data, or share a quick view of what got imported.
     *
     * The response is a JSON plot spec the frontend can render directly. 404 if the
     * dataset or plot style is unknown; the error message lists the registered styles.
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
     * Discover which backtest plots are available
     * List the visualizations you can render against a backtest's forecasts (forecast vs. actuals per region, calibration plots, ...).
     *
     * Use this to populate a plot picker before requesting a specific
     * ``/backtest-plots/{name}/{backtestId}`` URL.
     * @returns BacktestPlotType Successful Response
     * @throws ApiError
     */
    public static listBacktestPlotTypesV1VisualizationBacktestPlotsGet(): CancelablePromise<Array<BacktestPlotType>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/backtest-plots/',
        });
    }
    /**
     * Render a forecast plot for a backtest
     * Render the chosen visualization for a backtest's forecasts — used to assess model performance, identify regions where forecasts diverge from actuals, or share an evaluation result.
     *
     * The response is a Vega plot spec the frontend can render directly. Returns 404 if
     * the backtest or plot style is unknown; the error message lists the registered
     * styles.
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
    /**
     * Get Facet Coordinates
     * Returns unique structural dimension arrays available for layout faceting grids.
     * @param visualizationName
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getFacetCoordinatesV1VisualizationBacktestPlotsVisualizationNameBacktestIdFacetCoordsGet(
        visualizationName: string,
        backtestId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/backtest-plots/{visualization_name}/{backtest_id}/facet-coords',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Isolated Plots
     * Filters the source datasets by exact coordinate targets and generates a single Vega schema spec.
     * @param visualizationName
     * @param backtestId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateIsolatedPlotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdSubplotPost(
        visualizationName: string,
        backtestId: number,
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/visualization/backtest-plots/{visualization_name}/{backtest_id}/subplot',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate All Subplots
     * Generates a full flat checklist mapping coordinate variations against their respective Vega specs.
     * @param visualizationName
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateAllSubplotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdSubplotsGet(
        visualizationName: string,
        backtestId: number,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/visualization/backtest-plots/{visualization_name}/{backtest_id}/subplots',
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
