/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelDB } from '../models/ConfiguredModelDB';
import type { ConfiguredModelInfoRead } from '../models/ConfiguredModelInfoRead';
import type { ConfiguredModelWithDataSourceRead } from '../models/ConfiguredModelWithDataSourceRead';
import type { ConfiguredModelWithDataSourceReadWithPredictions } from '../models/ConfiguredModelWithDataSourceReadWithPredictions';
import type { ModelConfigurationCreate } from '../models/ModelConfigurationCreate';
import type { ModelSpecRead } from '../models/ModelSpecRead';
import type { ModelTemplateRead } from '../models/ModelTemplateRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ModelsService {
    /**
     * Browse available model templates
     * List every model template that can be configured into a runnable model — including archived ones, so historical references stay resolvable.
     *
     * Acts as the discovery endpoint: it is also where the CHAPKit v2 service registry
     * gets pulled in, so a template's ``health_status = "live"`` reflects whether the
     * backing CHAPKit service is currently registered. Stale CHAPKit templates whose
     * services have disappeared are auto-archived as a side effect.
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
     * Browse configured (ready-to-run) models
     * List every configured model — a template + user-chosen options bundled into something you can actually run.
     *
     * Use this to populate model pickers in backtest / prediction creation flows. Each
     * entry carries the configuration values along with template metadata so you can
     * surface "Model X (CRPS-tuned, 12 lags, ERA5)" or similar in a UI.
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
     * Configure a template into a runnable model
     * Bind a model template together with user-chosen option values into a new, named configured model — the unit that backtests and predictions actually reference.
     *
     * Use this when an operator has filled out the configuration form for a template
     * (lags, precision, extra covariates, ...) and wants to save it. The new row
     * inherits whether the template originated from a CHAPKit service. Returns 404 if
     * the template id is unknown.
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
     * View one configured model with its template
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     *
     * Look up a configured model together with the template it came from — the data you need to render a model detail pane (name, configuration values, covariates, version, ...).
     *
     * 404 if the id is unknown.
     * @param configuredModelId
     * @returns ConfiguredModelInfoRead Successful Response
     * @throws ApiError
     */
    public static getConfiguredModelInfoV1CrudConfiguredModelsConfiguredModelIdGet(
        configuredModelId: number,
    ): CancelablePromise<ConfiguredModelInfoRead> {
        return __request(OpenAPI, {
            method: 'GET',
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
     * Retire a configured model
     * Soft-delete a configured model so it stops showing up in pickers, while keeping the underlying row intact so historical backtests / predictions that reference it still resolve.
     *
     * The row stays in the database with ``archived=True``; existing references remain
     * valid. 404 if the id is unknown.
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
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
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
     * Get Configured Model With Data Source
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
     * @param configuredModelWithDataSourceId
     * @returns ConfiguredModelWithDataSourceReadWithPredictions Successful Response
     * @throws ApiError
     */
    public static getConfiguredModelWithDataSourceV1CrudConfiguredModelsWithDataSourceConfiguredModelWithDataSourceIdGet(
        configuredModelWithDataSourceId: number,
    ): CancelablePromise<ConfiguredModelWithDataSourceReadWithPredictions> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/configured-models-with-data-source/{configuredModelWithDataSourceId}',
            path: {
                'configuredModelWithDataSourceId': configuredModelWithDataSourceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Configured Model With Data Source From Backtest
     * ⚠️ **Experimental:** behavior and response shape may change without notice.
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
}
