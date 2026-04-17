/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelDB } from '../models/ConfiguredModelDB';
import type { ConfiguredModelWithDataSourceRead } from '../models/ConfiguredModelWithDataSourceRead';
import type { ModelConfigurationCreate } from '../models/ModelConfigurationCreate';
import type { ModelSpecRead } from '../models/ModelSpecRead';
import type { ModelTemplateRead } from '../models/ModelTemplateRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ModelsService {
    /**
     * List Model Templates
     * Lists all model templates from the db, including archived.
     * Also syncs live chapkit services from the v2 service registry
     * into the database (upsert by name).
     * @returns ModelTemplateRead Successful Response
     * @throws ApiError
     */
    public static listModelTemplatesV1CrudModelTemplatesGet(): CancelablePromise<Array<ModelTemplateRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/model-templates',
        });
    }
    /**
     * List Configured Models
     * List all configured models from the db
     * @returns ModelSpecRead Successful Response
     * @throws ApiError
     */
    public static listConfiguredModelsV1CrudConfiguredModelsGet(): CancelablePromise<Array<ModelSpecRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/configured-models',
        });
    }
    /**
     * Add Configured Model
     * Add a configured model to the database
     * @param requestBody
     * @returns ConfiguredModelDB Successful Response
     * @throws ApiError
     */
    public static addConfiguredModelV1CrudConfiguredModelsPost(
        requestBody: ModelConfigurationCreate,
    ): CancelablePromise<ConfiguredModelDB> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/configured-models',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Configured Model
     * Soft delete a configured model by setting archived to True
     * @param configuredModelId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteConfiguredModelV1CrudConfiguredModelsConfiguredModelIdDelete(
        configuredModelId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/crud/configured-models/{configuredModelId}',
            path: {
                'configuredModelId': configuredModelId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Configured Models With Data Source
     * @returns ConfiguredModelWithDataSourceRead Successful Response
     * @throws ApiError
     */
    public static listConfiguredModelsWithDataSourceV1CrudConfiguredModelsWithDataSourceGet(): CancelablePromise<Array<ConfiguredModelWithDataSourceRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/configured-models-with-data-source',
        });
    }
    /**
     * Create Configured Model With Data Source From Backtest
     * @param backtestId
     * @returns ConfiguredModelWithDataSourceRead Successful Response
     * @throws ApiError
     */
    public static createConfiguredModelWithDataSourceFromBacktestV1CrudConfiguredModelsWithDataSourceFromBacktestBacktestIdPost(
        backtestId: number,
    ): CancelablePromise<ConfiguredModelWithDataSourceRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/configured-models-with-data-source/from-backtest/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
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
    public static listModelsV1CrudModelsGet(): CancelablePromise<Array<ModelSpecRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/models',
        });
    }
    /**
     * Add Model
     * Add a model to the database (alias for configured models)
     * @param requestBody
     * @returns ConfiguredModelDB Successful Response
     * @throws ApiError
     */
    public static addModelV1CrudModelsPost(
        requestBody: ModelConfigurationCreate,
    ): CancelablePromise<ConfiguredModelDB> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/models',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
