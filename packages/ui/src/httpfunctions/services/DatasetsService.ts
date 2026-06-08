/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_create_dataset_csv_v1_crud_datasets_csvFile_post } from '../models/Body_create_dataset_csv_v1_crud_datasets_csvFile_post';
import type { chap_core__rest_api__data_models__DataBaseResponse } from '../models/chap_core__rest_api__data_models__DataBaseResponse';
import type { ChapDataSource } from '../models/ChapDataSource';
import type { DatasetCreate } from '../models/DatasetCreate';
import type { DataSetInfo } from '../models/DataSetInfo';
import type { DatasetMakeRequest } from '../models/DatasetMakeRequest';
import type { DataSetWithObservations } from '../models/DataSetWithObservations';
import type { ImportSummaryResponse } from '../models/ImportSummaryResponse';
import type { JobResponse } from '../models/JobResponse';
import type { ThresholdEntry } from '../models/ThresholdEntry';
import type { ThresholdRequest } from '../models/ThresholdRequest';
import type { ThresholdStrategyInfo } from '../models/ThresholdStrategyInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DatasetsService {
    /**
     * Browse imported datasets
     * List every imported dataset so you can pick one to back a backtest, run a prediction, or inspect its contents — metadata only, no observations inline.
     * @returns DataSetInfo Successful Response
     * @throws ApiError
     */
    public static getDatasetsV1CrudDatasetsGet(): CancelablePromise<Array<DataSetInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/datasets',
        });
    }
    /**
     * Import a health-only dataset
     * Import a dataset that carries just disease cases and population (no climate covariates inline), with polygons attached.
     *
     * Climate or other covariates are layered on later by the modelling pipeline.
     * Importing runs in the background; you get a job id and poll ``/v1/jobs/{id}``
     * (or ``/v1/jobs/{id}/database_result`` once finished) for the resulting dataset id.
     * For a dataset that ships its own covariates, use ``POST /v1/analytics/make-dataset``
     * instead.
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static createDatasetV1CrudDatasetsPost(
        requestBody: DatasetCreate,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/datasets',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Inspect a dataset's observations
     * Load a dataset together with every observation it contains, so you can audit what was imported or re-export it.
     *
     * NaN/inf values are coerced to JSON ``null`` so the response is always parseable.
     * Heavier than the listing — for casual browsing, prefer ``/datasets``. 404 if the id
     * is unknown.
     * @param datasetId
     * @returns DataSetWithObservations Successful Response
     * @throws ApiError
     */
    public static getDatasetV1CrudDatasetsDatasetIdGet(
        datasetId: number,
    ): CancelablePromise<DataSetWithObservations> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/datasets/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove an imported dataset
     * Permanently delete a dataset and every observation in it. Use this to clean up obsolete imports — be aware that backtests and predictions that referenced this dataset will lose their data link. 404 if the id is unknown.
     * @param datasetId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteDatasetV1CrudDatasetsDatasetIdDelete(
        datasetId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/crud/datasets/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Import a dataset from a CSV + geojson upload
     * Upload a CSV of observations together with the matching GeoJSON polygons (``NAME_1`` keyed) and persist it as a dataset synchronously.
     *
     * Use this when you have the files on disk and do not want to round-trip them
     * through DHIS2 or the JSON import endpoints. Inserts inline — no background job —
     * and returns the new dataset id immediately.
     * @param formData
     * @returns chap_core__rest_api__data_models__DataBaseResponse Successful Response
     * @throws ApiError
     */
    public static createDatasetCsvV1CrudDatasetsCsvFilePost(
        formData: Body_create_dataset_csv_v1_crud_datasets_csvFile_post,
    ): CancelablePromise<chap_core__rest_api__data_models__DataBaseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/datasets/csvFile',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read a dataset as tabular JSON rows
     * Get a dataset shaped as a list of JSON rows (one row per region and time period), in the form pandas, Observable, or any tabular tool can consume directly.
     *
     * Use this when a UI needs to render the dataset as a table, or when a notebook
     * consumer wants to drop the result into ``pd.DataFrame``. Non-finite values come
     * through as JSON ``null``. 404 if the dataset id is unknown.
     * @param datasetId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getDatasetDfV1CrudDatasetsDatasetIdDfGet(
        datasetId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/datasets/{datasetId}/df',
            path: {
                'datasetId': datasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Export a dataset as a CSV download
     * Download a dataset as a CSV file — one row per region and time period.
     *
     * Use this when a user wants to pull the imported data out for use in Excel, R,
     * pandas, or any other offline tool. 404 if the dataset id is unknown.
     * @param datasetId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getDatasetCsvV1CrudDatasetsDatasetIdCsvGet(
        datasetId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/datasets/{datasetId}/csv',
            path: {
                'datasetId': datasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Import observations as a reusable dataset
     * Persist observations (with polygons) as a named dataset you can reuse across backtests and predictions.
     *
     * Use this to turn a one-off batch of DHIS2 / file-based observations into something
     * stored, so a single dataset can back multiple evaluations. Import happens in the
     * background — the response gives you a job id plus a per-location rejection summary
     * (validation runs synchronously, the harmonise-and-load step async). Poll
     * ``/v1/jobs/{id}`` to know when the dataset is queryable.
     * @param requestBody
     * @returns ImportSummaryResponse Successful Response
     * @throws ApiError
     */
    public static makeDatasetV1AnalyticsMakeDatasetPost(
        requestBody: DatasetMakeRequest,
    ): CancelablePromise<ImportSummaryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/analytics/make-dataset',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Discover which external data sources can feed a dataset
     * List the external covariate sources CHAP knows about (ERA5 temperature, precipitation, ...) and the dataset features each one maps to.
     *
     * Use this to power a data-source picker when authoring a dataset or a prediction
     * setup, so users can pick covariates by what they cover rather than by their internal
     * identifier.
     * @returns ChapDataSource Successful Response
     * @throws ApiError
     */
    public static getDataSourcesV1AnalyticsDataSourcesGet(): CancelablePromise<Array<ChapDataSource>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/data-sources',
        });
    }
    /**
     * Discover which threshold strategies are available
     * List the registered threshold strategies (seasonal mean + k*std, ...), with a name and description for each.
     *
     * Use this to populate a strategy picker before requesting a specific threshold via
     * `POST /v1/analytics/thresholds`.
     * @returns ThresholdStrategyInfo Successful Response
     * @throws ApiError
     */
    public static listThresholdStrategyTypesV1AnalyticsThresholdsStrategiesGet(): CancelablePromise<Array<ThresholdStrategyInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/thresholds/strategies',
        });
    }
    /**
     * Compute thresholds (endemic channel) for a dataset
     * Compute one outbreak threshold per (period, org unit) from a dataset's historical disease_cases, using the chosen strategy.
     *
     * 404 if the strategy id is not registered or the dataset has no `disease_cases`
     * observations.
     * @param requestBody
     * @returns ThresholdEntry Successful Response
     * @throws ApiError
     */
    public static computeThresholdsV1AnalyticsThresholdsPost(
        requestBody: ThresholdRequest,
    ): CancelablePromise<Array<ThresholdEntry>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/analytics/thresholds',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
