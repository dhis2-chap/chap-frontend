/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackTest } from '../models/BackTest';
import type { BackTestCreate } from '../models/BackTestCreate';
import type { BacktestDomain } from '../models/BacktestDomain';
import type { BackTestRead } from '../models/BackTestRead';
import type { BackTestUpdate } from '../models/BackTestUpdate';
import type { DataList } from '../models/DataList';
import type { EvaluationEntry } from '../models/EvaluationEntry';
import type { ImportSummaryResponse } from '../models/ImportSummaryResponse';
import type { JobResponse } from '../models/JobResponse';
import type { MakeBacktestRequest } from '../models/MakeBacktestRequest';
import type { MakeBacktestWithDataRequest } from '../models/MakeBacktestWithDataRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BacktestsService {
    /**
     * Get Backtests
     * Returns a list of backtests/evaluations with only the id and name
     * @returns BackTestRead Successful Response
     * @throws ApiError
     */
    public static getBacktestsV1CrudBacktestsGet(): CancelablePromise<Array<BackTestRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/crud/backtests',
        });
    }
    /**
     * Create Backtest
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static createBacktestV1CrudBacktestsPost(
        requestBody: BackTestCreate,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/crud/backtests',
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
     * Get Backtest
     * @param backtestId
     * @returns BackTest Successful Response
     * @throws ApiError
     */
    public static getBacktestV1CrudBacktestsBacktestIdFullGet(
        backtestId: number,
    ): CancelablePromise<BackTest> {
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
     * Get Backtest Info
     * @param backtestId
     * @returns BackTestRead Successful Response
     * @throws ApiError
     */
    public static getBacktestInfoV1CrudBacktestsBacktestIdInfoGet(
        backtestId: number,
    ): CancelablePromise<BackTestRead> {
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
     * Delete Backtest
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
     * Update Backtest
     * @param backtestId
     * @param requestBody
     * @returns BackTestRead Successful Response
     * @throws ApiError
     */
    public static updateBacktestV1CrudBacktestsBacktestIdPatch(
        backtestId: number,
        requestBody: BackTestUpdate,
    ): CancelablePromise<BackTestRead> {
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
     * Get Compatible Backtests
     * Return a list of backtests that are compatible for comparison with the given backtest
     * @param backtestId
     * @returns BackTestRead Successful Response
     * @throws ApiError
     */
    public static getCompatibleBacktestsV1AnalyticsCompatibleBacktestsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<BackTestRead>> {
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
     * Get Backtest Overlap
     * Return the org units and split periods that are common between two backtests
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
     * Get Evaluation Entries
     * Return quantiles for the forecasts in a backtest. Can optionally be filtered on split period and org units.
     * NOTE: If org_units is set to ["adm0"], the sum over all regions is returned.
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
     * Create Backtest
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
     * Get Actual Cases
     * Return the actual disease cases corresponding to a backtest. Can optionally be filtered on org units.
     *
     * Note: If org_units is set to ["adm0"], the sum over all regions is returned.
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
     * Create Backtest With Data
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
}
