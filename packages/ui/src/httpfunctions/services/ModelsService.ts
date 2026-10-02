/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelDB } from '../models/ConfiguredModelDB';
import type { ConfiguredModelInfoRead } from '../models/ConfiguredModelInfoRead';
import type { ModelConfigurationCreate } from '../models/ModelConfigurationCreate';
import type { ModelSpecRead } from '../models/ModelSpecRead';
import type { ModelTemplateFromService } from '../models/ModelTemplateFromService';
import type { ModelTemplateRead } from '../models/ModelTemplateRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ModelsService {
    /**
     * Browse available model templates
     * List every live model template that can be configured into a runnable model — one per template name; superseded versions keep their rows but are not listed.
     *
     * Acts as the discovery endpoint: registered CHAPKit services without a stored
     * template get one here, and a template's ``health_status`` reflects whether the
     * backing CHAPKit service is currently registered (``"live"``) and still runs the
     * stored source revision (``"revision_mismatch"`` otherwise). Discovery creates no
     * configured models; those come from the marketplace entry through
     * ``chap-admin install``. A newly discovered version of a stored template is listed
     * once it has a configured model.
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
     * Store a model template from a registered CHAPKit service
     * Store the template a live CHAPKit service describes, read from its own info and config schema.
     *
     * This is how ``chap-admin install`` registers a model once its service is up, and how
     * a custom image without a marketplace entry becomes a model in CHAP. A version is
     * write-once, so repeating the call returns the stored row (and shows it again if it
     * was retired). The service must be registered in the v2 service registry and
     * reachable. 404 if it is not registered, 409 if it reports no git revision or another
     * revision than the one stored under its version, 502 if it cannot be read.
     * @param requestBody
     * @returns ModelTemplateRead Successful Response
     * @throws ApiError
     */
    public static addModelTemplateFromServiceV1CrudModelTemplatesFromServicePost(
        requestBody: ModelTemplateFromService,
    ): CancelablePromise<ModelTemplateRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/model-templates/from-service',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Retire a model template
     * Hide a model template and its configured models from pickers, keeping the rows so historical backtests still resolve.
     *
     * Retiring the live version makes the newest earlier version that can run live again.
     * With ``allVersions=true`` every version of the template's name is retired instead,
     * which is what ``chap-admin uninstall`` does. Storing the same name and version again
     * shows that version again. 404 if the id is unknown.
     * @param modelTemplateId
     * @param allVersions
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteModelTemplateV1CrudModelTemplatesModelTemplateIdDelete(
        modelTemplateId: number,
        allVersions: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/crud/model-templates/{modelTemplateId}',
            path: {
                'modelTemplateId': modelTemplateId,
            },
            query: {
                'allVersions': allVersions,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Browse configured (ready-to-run) models
     * List every configured model — a template + user-chosen options bundled into something you can actually run.
     *
     * Use this to populate model pickers in backtest / prediction creation flows. Each
     * entry carries the configuration values along with template metadata so you can
     * surface "Model X (CRPS-tuned, 12 lags, ERA5)" or similar in a UI.
     * Health is read from the service registry without syncing or archiving templates.
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
}
