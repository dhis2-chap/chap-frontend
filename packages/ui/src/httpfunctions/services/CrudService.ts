/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackTestCreate } from '../models/BackTestCreate';
import type { BackTestFull } from '../models/BackTestFull';
import type { BackTestRead } from '../models/BackTestRead';
import type { BackTestUpdate } from '../models/BackTestUpdate';
import type { Body_create_dataset_csv_crud_datasets_csvFile_post } from '../models/Body_create_dataset_csv_crud_datasets_csvFile_post';
import type { ConfiguredModelDB } from '../models/ConfiguredModelDB';
import type { DataBaseResponse } from '../models/DataBaseResponse';
import type { DatasetCreate } from '../models/DatasetCreate';
import type { DataSetRead } from '../models/DataSetRead';
import type { DataSetWithObservations } from '../models/DataSetWithObservations';
import type { DebugEntry } from '../models/DebugEntry';
import type { JobResponse } from '../models/JobResponse';
import type { ModelConfigurationCreate } from '../models/ModelConfigurationCreate';
import type { ModelSpecRead } from '../models/ModelSpecRead';
import type { ModelTemplateRead } from '../models/ModelTemplateRead';
import type { NewClass } from '../models/NewClass';
import type { PredictionCreate } from '../models/PredictionCreate';
import type { PredictionRead } from '../models/PredictionRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CrudService {
    /**
     * Get Backtests
     * Returns a list of backtests/evaluations with only the id and name
     * @returns BackTestRead Successful Response
     * @throws ApiError
     */
    public static getBacktestsCrudBacktestsGet(): CancelablePromise<Array<BackTestRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/backtests',
        });
    }
    /**
     * Create Backtest
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static createBacktestCrudBacktestsPost(
        requestBody: BackTestCreate,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/crud/backtests',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Backtest Batch
     * @param ids
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteBacktestBatchCrudBacktestsDelete(
        ids: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/crud/backtests',
            query: {
                'ids': ids,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Backtest
     * @param backtestId
     * @returns BackTestFull Successful Response
     * @throws ApiError
     */
    public static getBacktestCrudBacktestsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<BackTestFull> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/backtests/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Backtest
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteBacktestCrudBacktestsBacktestIdDelete(
        backtestId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/crud/backtests/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Backtest
     * @param backtestId
     * @param requestBody
     * @returns BackTestRead Successful Response
     * @throws ApiError
     */
    public static updateBacktestCrudBacktestsBacktestIdPatch(
        backtestId: number,
        requestBody: BackTestUpdate,
    ): CancelablePromise<BackTestRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/crud/backtests/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Predictions
     * @returns NewClass Successful Response
     * @throws ApiError
     */
    public static getPredictionsCrudPredictionsGet(): CancelablePromise<Array<NewClass>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/predictions',
        });
    }
    /**
     * Create Prediction
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static createPredictionCrudPredictionsPost(
        requestBody: PredictionCreate,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/crud/predictions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Prediction
     * @param predictionId
     * @returns PredictionRead Successful Response
     * @throws ApiError
     */
    public static getPredictionCrudPredictionsPredictionIdGet(
        predictionId: number,
    ): CancelablePromise<PredictionRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/predictions/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Prediction
     * @param predictionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deletePredictionCrudPredictionsPredictionIdDelete(
        predictionId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/crud/predictions/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Datasets
     * @returns DataSetRead Successful Response
     * @throws ApiError
     */
    public static getDatasetsCrudDatasetsGet(): CancelablePromise<Array<DataSetRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/datasets',
        });
    }
    /**
     * Create Dataset
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static createDatasetCrudDatasetsPost(
        requestBody: DatasetCreate,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/crud/datasets',
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
    public static getDatasetCrudDatasetsDatasetIdGet(
        datasetId: number,
    ): CancelablePromise<DataSetWithObservations> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/datasets/{datasetId}',
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
    public static deleteDatasetCrudDatasetsDatasetIdDelete(
        datasetId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/crud/datasets/{datasetId}',
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
    public static createDatasetCsvCrudDatasetsCsvFilePost(
        formData: Body_create_dataset_csv_crud_datasets_csvFile_post,
    ): CancelablePromise<DataBaseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/crud/datasets/csvFile',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Model Templates
     * Lists all model templates from the db.
     * @returns ModelTemplateRead Successful Response
     * @throws ApiError
     */
    public static listModelTemplatesCrudModelTemplatesGet(): CancelablePromise<Array<ModelTemplateRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/model-templates',
        });
    }
    /**
     * Delete Model Template
     * @param modelTemplateId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteModelTemplateCrudModelTemplatesModelTemplateIdDelete(
        modelTemplateId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/crud/model-templates/{modelTemplateId}',
            path: {
                'modelTemplateId': modelTemplateId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Configured Models
     * List all configured models from the db
     * @returns ModelSpecRead Successful Response
     * @throws ApiError
     */
    public static listConfiguredModelsCrudConfiguredModelsGet(): CancelablePromise<Array<ModelSpecRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/configured-models',
        });
    }
    /**
     * Add Configured Model
     * Add a configured model to the database
     * @param requestBody
     * @returns ConfiguredModelDB Successful Response
     * @throws ApiError
     */
    public static addConfiguredModelCrudConfiguredModelsPost(
        requestBody: ModelConfigurationCreate,
    ): CancelablePromise<ConfiguredModelDB> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/crud/configured-models',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Models
     * List all models from the db (alias for configured models)
     * @returns ModelSpecRead Successful Response
     * @throws ApiError
     */
    public static listModelsCrudModelsGet(): CancelablePromise<Array<ModelSpecRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/models',
        });
    }
    /**
     * Add Model
     * Add a model to the database (alias for configured models)
     * @param requestBody
     * @returns ConfiguredModelDB Successful Response
     * @throws ApiError
     */
    public static addModelCrudModelsPost(
        requestBody: ModelConfigurationCreate,
    ): CancelablePromise<ConfiguredModelDB> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/crud/models',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Debug Entry
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static debugEntryCrudDebugPost(): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/crud/debug',
        });
    }
    /**
     * Get Debug Entry
     * @param debugId
     * @returns DebugEntry Successful Response
     * @throws ApiError
     */
    public static getDebugEntryCrudDebugDebugIdGet(
        debugId: number,
    ): CancelablePromise<DebugEntry> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crud/debug/{debugId}',
            path: {
                'debugId': debugId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
