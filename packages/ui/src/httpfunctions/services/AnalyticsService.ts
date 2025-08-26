/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BacktestDomain } from '../models/BacktestDomain';
import type { BackTestRead } from '../models/BackTestRead';
import type { DataList } from '../models/DataList';
import type { DatasetMakeRequest } from '../models/DatasetMakeRequest';
import type { DataSource } from '../models/DataSource';
import type { EvaluationEntry } from '../models/EvaluationEntry';
import type { ImportSummaryResponse } from '../models/ImportSummaryResponse';
import type { JobResponse } from '../models/JobResponse';
import type { MakeBacktestRequest } from '../models/MakeBacktestRequest';
import type { MakeBacktestWithDataRequest } from '../models/MakeBacktestWithDataRequest';
import type { MakePredictionRequest } from '../models/MakePredictionRequest';
import type { PredictionEntry } from '../models/PredictionEntry';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsService {
    /**
     * Make Dataset
     * This endpoint creates a dataset from the provided data and the data to be fetched3
     * and puts it in the database
     * @param requestBody
     * @returns ImportSummaryResponse Successful Response
     * @throws ApiError
     */
    public static makeDatasetAnalyticsMakeDatasetPost(
        requestBody: DatasetMakeRequest,
    ): CancelablePromise<ImportSummaryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/analytics/make-dataset',
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
    public static getCompatibleBacktestsAnalyticsCompatibleBacktestsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<BackTestRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/compatible-backtests/{backtestId}',
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
    public static getBacktestOverlapAnalyticsBacktestOverlapBacktestId1BacktestId2Get(
        backtestId1: number,
        backtestId2: number,
    ): CancelablePromise<BacktestDomain> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/backtest-overlap/{backtestId1}/{backtestId2}',
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
     * @param backtestId
     * @param quantiles
     * @param splitPeriod
     * @param orgUnits
     * @returns EvaluationEntry Successful Response
     * @throws ApiError
     */
    public static getEvaluationEntriesAnalyticsEvaluationEntryGet(
        backtestId: number,
        quantiles: Array<number>,
        splitPeriod?: string,
        orgUnits?: Array<string>,
    ): CancelablePromise<Array<EvaluationEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/evaluation-entry',
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
    public static createBacktestAnalyticsCreateBacktestPost(
        requestBody: MakeBacktestRequest,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/analytics/create-backtest',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Make Prediction
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public static makePredictionAnalyticsMakePredictionPost(
        requestBody: MakePredictionRequest,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/analytics/make-prediction',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Prediction Entries
     * @param predictionId
     * @param quantiles
     * @returns PredictionEntry Successful Response
     * @throws ApiError
     */
    public static getPredictionEntriesAnalyticsPredictionEntryPredictionIdGet(
        predictionId: number,
        quantiles: Array<number>,
    ): CancelablePromise<Array<PredictionEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/prediction-entry/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'quantiles': quantiles,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Actual Cases
     * Return the actual disease cases corresponding to a backtest. Can optionally be filtered on org units.
     * @param backtestId
     * @param orgUnits
     * @returns DataList Successful Response
     * @throws ApiError
     */
    public static getActualCasesAnalyticsActualCasesBacktestIdGet(
        backtestId: number,
        orgUnits?: Array<string>,
    ): CancelablePromise<DataList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/actualCases/{backtestId}',
            path: {
                'backtestId': backtestId,
            },
            query: {
                'orgUnits': orgUnits,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Data Sources
     * @returns DataSource Successful Response
     * @throws ApiError
     */
    public static getDataSourcesAnalyticsDataSourcesGet(): CancelablePromise<Array<DataSource>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/data-sources',
        });
    }
    /**
     * Create Backtest With Data
     * @param requestBody
     * @param dryRun If True, only run validation and do not create a backtest
     * @returns ImportSummaryResponse Successful Response
     * @throws ApiError
     */
    public static createBacktestWithDataAnalyticsCreateBacktestWithDataPost(
        requestBody: MakeBacktestWithDataRequest,
        dryRun: boolean = false,
    ): CancelablePromise<ImportSummaryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/analytics/create-backtest-with-data/',
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
