/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_create_dataset_csv_v1_crud_datasets_csvFile_post } from '../models/Body_create_dataset_csv_v1_crud_datasets_csvFile_post';
import type { ChapDataSource } from '../models/ChapDataSource';
import type { DataBaseResponse } from '../models/DataBaseResponse';
import type { DatasetCreate } from '../models/DatasetCreate';
import type { DataSetInfo } from '../models/DataSetInfo';
import type { DatasetMakeRequest } from '../models/DatasetMakeRequest';
import type { DataSetWithObservations } from '../models/DataSetWithObservations';
import type { ImportSummaryResponse } from '../models/ImportSummaryResponse';
import type { JobResponse } from '../models/JobResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DatasetsService {
    /**
     * Get Datasets
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
     * Create Dataset
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
     * Get Dataset
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
     * Delete Dataset
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
     * Create Dataset Csv
     * @param formData
     * @returns DataBaseResponse Successful Response
     * @throws ApiError
     */
    public static createDatasetCsvV1CrudDatasetsCsvFilePost(
        formData: Body_create_dataset_csv_v1_crud_datasets_csvFile_post,
    ): CancelablePromise<DataBaseResponse> {
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
     * Get Dataset Df
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
     * Get Dataset Csv
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
     * Make Dataset
     * This endpoint creates a dataset from the provided data and the data to be fetched3
     * and puts it in the database
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
     * Get Data Sources
     * @returns ChapDataSource Successful Response
     * @throws ApiError
     */
    public static getDataSourcesV1AnalyticsDataSourcesGet(): CancelablePromise<Array<ChapDataSource>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/data-sources',
        });
    }
}
