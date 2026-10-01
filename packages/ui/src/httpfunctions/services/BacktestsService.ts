/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Backtest } from '../models/Backtest';
import type { BacktestDomain } from '../models/BacktestDomain';
import type { BacktestRead } from '../models/BacktestRead';
import type { BacktestSpecificationRead } from '../models/BacktestSpecificationRead';
import type { BacktestSpecificationSummary } from '../models/BacktestSpecificationSummary';
import type { BacktestUpdate } from '../models/BacktestUpdate';
import type { DataList } from '../models/DataList';
import type { EvaluationEntry } from '../models/EvaluationEntry';
import type { ImportSummaryResponse } from '../models/ImportSummaryResponse';
import type { JobResponse } from '../models/JobResponse';
import type { MakeBacktestRequest } from '../models/MakeBacktestRequest';
import type { MakeBacktestsRequest } from '../models/MakeBacktestsRequest';
import type { MakeBacktestsResponse } from '../models/MakeBacktestsResponse';
import type { MakeBacktestWithDataRequest } from '../models/MakeBacktestWithDataRequest';
import type { WeatherProviderInfo } from '../models/WeatherProviderInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BacktestsService {
    /**
     * Browse stored evaluation runs
     * List stored backtests so you can pick one to view, compare against another, plot metrics from, or promote into a saved prediction setup.
     *
     * Each entry carries enough metadata to identify it at a glance (dataset, model,
     * periods, regions) but not the raw forecasts — fetch those via
     * ``/backtests/{id}/full`` only when you actually need them. Filter by
     * ``specificationId`` to get the backtests that are comparable with each other, or by
     * ``datasetId`` for everything run against one dataset.
     * @param specificationId
     * @param datasetId
     * @returns BacktestRead Successful Response
     * @throws ApiError
     */
    public static getBacktestsV1CrudBacktestsGet(
        specificationId?: (number | null),
        datasetId?: (number | null),
    ): CancelablePromise<Array<BacktestRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/backtests',
            query: {
                'specificationId': specificationId,
                'datasetId': datasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk-remove several evaluation runs
     * Permanently delete several backtests in one round-trip — pass their ids as a comma-separated ``ids`` query string.
     *
     * Useful for bulk cleanup from a UI's multi-select. Unknown ids are silently skipped;
     * the response only reports how many rows actually went away. 400 if ``ids`` is empty
     * or contains a non-integer segment.
     * @param ids
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteBacktestBatchV1CrudBacktestsDelete(
        ids: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/crud/backtests',
            query: {
                'ids': ids,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List the evaluation setups backtests have run under
     * List backtest specifications: a dataset plus the parameters that make backtests under it comparable.
     *
     * A specification with several backtests under it is a benchmark. Filter by
     * ``datasetId`` and any of the ``BacktestParams`` fields; the full tuple identifies at
     * most one specification, which is how an external system finds a benchmark again
     * without storing the specification id. Rows carry counts only; fetch
     * ``/backtest-specifications/{id}`` for the backtests themselves.
     * @param datasetId Only specifications evaluating this dataset.
     * @param nPeriods Number of periods to forecast at each split.
     * @param nSplits Total number of rolling train/test splits.
     * @param stride Number of periods to advance between successive splits.
     * @param nRetrain Number of times the model is retrained, evenly spaced across the splits. 1 means train once.
     * @param futureWeatherProvider Id of the registered future-weather provider supplying climate covariates for each forecast window. Use the same provider here and on the prediction so backtest scores reflect what the model will see in production. See GET /v1/analytics/weather-providers.
     * @returns BacktestSpecificationSummary Successful Response
     * @throws ApiError
     */
    public static getBacktestSpecificationsV1CrudBacktestSpecificationsGet(
        datasetId?: (number | null),
        nPeriods?: (number | null),
        nSplits?: (number | null),
        stride?: (number | null),
        nRetrain?: (number | null),
        futureWeatherProvider?: (string | null),
    ): CancelablePromise<Array<BacktestSpecificationSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/backtest-specifications',
            query: {
                'datasetId': datasetId,
                'nPeriods': nPeriods,
                'nSplits': nSplits,
                'stride': stride,
                'nRetrain': nRetrain,
                'futureWeatherProvider': futureWeatherProvider,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Fetch a specification with every backtest under it
     * Read one specification together with every backtest that ran under it, newest first, in a single response.
     *
     * This is the benchmark leaderboard: each backtest row is the ``BacktestRead`` shape
     * with aggregate metrics, the configured model and its template, so a client can rank
     * models without a request per backtest. Forecasts and per-org-unit metrics are not
     * included. 404 if the id is unknown.
     * @param specificationId
     * @returns BacktestSpecificationRead Successful Response
     * @throws ApiError
     */
    public static getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet(
        specificationId: number,
    ): CancelablePromise<BacktestSpecificationRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/backtest-specifications/{specificationId}',
            path: {
                'specificationId': specificationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Fetch a backtest with every forecast inline
     * Load the complete backtest payload — every forecast row and the dataset's GeoJSON — in a single response.
     *
     * Use this when a client genuinely needs the whole evaluation (e.g. exporting it,
     * rebuilding it offline). For listings or UI summaries, the cheaper ``/info`` or
     * ``/backtests/{id}`` variants are usually what you want. 404 if the id is unknown.
     * @param backtestId
     * @returns Backtest Successful Response
     * @throws ApiError
     */
    public static getBacktestV1CrudBacktestsBacktestIdFullGet(
        backtestId: number,
    ): CancelablePromise<Backtest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/backtests/{backtestId}/full',
            path: {
                'backtestId': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * View one backtest's metadata (alias of /info)
     * Read a single backtest's identifying information — name, dataset, configured model + template, the periods and regions it covers — without paying for the forecast payload.
     *
     * Use this for detail panes, breadcrumb headers, or anywhere a UI needs to render
     * "what is this backtest" without scrolling through forecasts. Both
     * ``/backtests/{id}`` and ``/backtests/{id}/info`` resolve to this same operation;
     * fetch ``/full`` if you also want the forecasts. 404 if the id is unknown.
     * @param backtestId
     * @returns BacktestRead Successful Response
     * @throws ApiError
     */
    public static getBacktestInfoV1CrudBacktestsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<BacktestRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/backtests/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove an evaluation run
     * Permanently delete a backtest and every forecast attached to it.
     *
     * Use this to clean up failed runs or evaluations that should no longer appear in the
     * listing. Returns 404 if the id is unknown.
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteBacktestV1CrudBacktestsBacktestIdDelete(
        backtestId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/crud/backtests/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Edit a backtest's editable fields
     * Rename a backtest or update its mutable metadata without re-running the evaluation.
     *
     * Only the fields you send are touched (semantically: ``exclude_unset``), so it is
     * safe to PATCH a single attribute. Returns the refreshed metadata. 404 if the id is
     * unknown.
     * @param backtestId
     * @param requestBody
     * @returns BacktestRead Successful Response
     * @throws ApiError
     */
    public static updateBacktestV1CrudBacktestsBacktestIdPatch(
        backtestId: number,
        requestBody: BacktestUpdate,
    ): CancelablePromise<BacktestRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/crud/backtests/{backtestId}',
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
     * View one backtest's metadata
     * Read a single backtest's identifying information — name, dataset, configured model + template, the periods and regions it covers — without paying for the forecast payload.
     *
     * Use this for detail panes, breadcrumb headers, or anywhere a UI needs to render
     * "what is this backtest" without scrolling through forecasts. Both
     * ``/backtests/{id}`` and ``/backtests/{id}/info`` resolve to this same operation;
     * fetch ``/full`` if you also want the forecasts. 404 if the id is unknown.
     * @param backtestId
     * @returns BacktestRead Successful Response
     * @throws ApiError
     */
    public static getBacktestInfoV1CrudBacktestsBacktestIdInfoGet(
        backtestId: number,
    ): CancelablePromise<BacktestRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/backtests/{backtestId}/info',
            path: {
                'backtestId': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Find backtests that can be compared with this one
     * Find every other backtest that shares at least one region and one split period with this one — i.e. backtests it makes sense to overlay or diff against in a plot.
     *
     * Use this to power a "compare to..." picker in the UI without offering choices that
     * would produce empty intersections.
     * @param backtestId
     * @returns BacktestRead Successful Response
     * @throws ApiError
     */
    public static getCompatibleBacktestsV1AnalyticsCompatibleBacktestsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<BacktestRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/compatible-backtests/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Inspect the shared regions and periods of two backtests
     * Get the regions and split periods two backtests have in common — the slice on which side-by-side comparison is even meaningful.
     *
     * Use this before building a side-by-side plot to know which axes are valid for both
     * backtests. 404 if either id is unknown.
     * @param backtestId1
     * @param backtestId2
     * @returns BacktestDomain Successful Response
     * @throws ApiError
     */
    public static getBacktestOverlapV1AnalyticsBacktestOverlapBacktestId1BacktestId2Get(
        backtestId1: number,
        backtestId2: number,
    ): CancelablePromise<BacktestDomain> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/backtest-overlap/{backtestId1}/{backtestId2}',
            path: {
                'backtestId1': backtestId1,
                'backtestId2': backtestId2,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read forecast quantiles from a backtest
     * Pull the chosen quantiles from a backtest's forecasts so they can be charted, exported, or compared against actuals.
     *
     * Optionally narrow the slice with ``splitPeriod`` (a single training horizon) or
     * ``orgUnits`` (specific regions). Passing ``orgUnits=["adm0"]`` collapses the result
     * into one row per period — the sum over every region — which is what you want for
     * national-level overlays. 404 if the backtest id is unknown.
     * @param backtestId
     * @param quantiles
     * @param splitPeriod
     * @param orgUnits
     * @returns EvaluationEntry Successful Response
     * @throws ApiError
     */
    public static getEvaluationEntriesV1AnalyticsEvaluationEntryGet(
        backtestId: number,
        quantiles: Array<number>,
        splitPeriod?: string,
        orgUnits?: Array<string>,
    ): CancelablePromise<Array<EvaluationEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/evaluation-entry',
            query: {
                'backtestId': backtestId,
                'quantiles': quantiles,
                'splitPeriod': splitPeriod,
                'orgUnits': orgUnits,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run a backtest against a stored dataset
     * Train and evaluate a configured model on a dataset that's already been imported, producing a backtest you can score, plot, or promote into a prediction setup.
     *
     * Runs asynchronously; you get a job id and poll ``/v1/jobs/{id}`` (or
     * ``/v1/jobs/{id}/evaluation_result`` once finished) to find the resulting backtest.
     * 404 if the referenced dataset does not exist.
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static createBacktestV1AnalyticsCreateBacktestPost(
        requestBody: MakeBacktestRequest,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/analytics/create-backtest',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run several configured models under one evaluation specification
     * Evaluate a set of configured models on one stored dataset with one set of parameters, so the resulting backtests are comparable by construction.
     *
     * The specification is resolved up front and one job is queued per model; a model
     * failing does not affect the others. The response carries the specification id, under
     * which every backtest of the run files, so the results can be fetched from
     * ``GET /v1/crud/backtest-specifications/{id}`` without a second lookup, plus one job id
     * per model to poll via ``/v1/jobs/{id}``. 404 if the dataset or a model does not exist,
     * 422 if no org unit has target data left to train on for these parameters.
     * @param requestBody
     * @returns MakeBacktestsResponse Successful Response
     * @throws ApiError
     */
    public static createBacktestsV1AnalyticsCreateBacktestsPost(
        requestBody: MakeBacktestsRequest,
    ): CancelablePromise<MakeBacktestsResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/analytics/create-backtests',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * @deprecated
     * Deprecated camelCase alias of /actual-cases/{backtestId}
     * Deprecated camelCase alias of ``GET /v1/analytics/actual-cases/{backtestId}``. Behaviour is identical; new integrations should call the kebab-case path, which matches the rest of the API's URL style.
     * @param backtestId
     * @param orgUnits
     * @param isDatasetId
     * @returns DataList Successful Response
     * @throws ApiError
     */
    public static getActualCasesV1AnalyticsActualCasesBacktestIdGet(
        backtestId: number,
        orgUnits?: Array<string>,
        isDatasetId: boolean = false,
    ): CancelablePromise<DataList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/actualCases/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            query: {
                'orgUnits': orgUnits,
                'isDatasetId': isDatasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read the observed disease cases a backtest was scored against
     * Pull the actual ``disease_cases`` series from the dataset that backs a backtest, so a plot can show forecast vs. reality on the same axes.
     *
     * Filter to specific regions with ``orgUnits``, or pass ``orgUnits=["adm0"]`` to get
     * one summed series across every region (useful for national-level views). Set
     * ``isDatasetId=true`` to skip the backtest lookup and read directly from a dataset
     * id. 404 if the backtest is unknown (and ``isDatasetId`` is false).
     * @param backtestId
     * @param orgUnits
     * @param isDatasetId
     * @returns DataList Successful Response
     * @throws ApiError
     */
    public static getActualCasesAliasV1AnalyticsActualCasesBacktestIdGet(
        backtestId: number,
        orgUnits?: Array<string>,
        isDatasetId: boolean = false,
    ): CancelablePromise<DataList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/actual-cases/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            query: {
                'orgUnits': orgUnits,
                'isDatasetId': isDatasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Run a backtest from inline data
     * Train and evaluate a model on observations supplied directly in the request body, without first creating a reusable dataset.
     *
     * Convenient for quick experiments where the data is not worth persisting. Pass
     * ``dryRun=true`` to run validation only (cheap, synchronous) and inspect which
     * regions would be rejected — useful as a preflight before committing to an import. A
     * real run returns a job id; poll ``/v1/jobs/{id}`` for status. The response also
     * surfaces any per-location rejections that came out of validation.
     * @param requestBody
     * @param dryRun If True, only run validation and do not create a backtest
     * @returns ImportSummaryResponse Successful Response
     * @throws ApiError
     */
    public static createBacktestWithDataV1AnalyticsCreateBacktestWithDataPost(
        requestBody: MakeBacktestWithDataRequest,
        dryRun: boolean = false,
    ): CancelablePromise<ImportSummaryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/analytics/create-backtest-with-data/',
            query: {
                'dryRun': dryRun,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Discover which future-weather providers are available
     * List the registered future-weather providers, with a name, description and look-ahead flag for each.
     *
     * Use this to populate a picker before setting `future_weather_provider` on a backtest or
     * prediction request.
     * @returns WeatherProviderInfo Successful Response
     * @throws ApiError
     */
    public static listFutureWeatherProvidersV1AnalyticsWeatherProvidersGet(): CancelablePromise<Array<WeatherProviderInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/weather-providers',
        });
    }
}
