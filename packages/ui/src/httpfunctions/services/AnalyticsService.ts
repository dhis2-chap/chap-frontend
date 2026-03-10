import type { BacktestDomain } from '../models/BacktestDomain';
import type { BackTestRead } from '../models/BackTestRead';
import type { DataList } from '../models/DataList';
import type { EvaluationEntry } from '../models/EvaluationEntry';
import type { ImportSummaryResponse } from '../models/ImportSummaryResponse';
import type { JobResponse } from '../models/JobResponse';
import type { MakeBacktestWithDataRequest } from '../models/MakeBacktestWithDataRequest';
import type { MakePredictionRequest } from '../models/MakePredictionRequest';
import type { PredictionEntry } from '../models/PredictionEntry';
import type { CancelablePromise } from '../core/CancelablePromise';
import { BacktestsService } from './BacktestsService';
import { PredictionsService } from './PredictionsService';

export class AnalyticsService {
    public static getCompatibleBacktestsAnalyticsCompatibleBacktestsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<BackTestRead>> {
        return BacktestsService.getCompatibleBacktestsV1AnalyticsCompatibleBacktestsBacktestIdGet(
            backtestId,
        );
    }

    public static getBacktestOverlapAnalyticsBacktestOverlapBacktestId1BacktestId2Get(
        backtestId1: number,
        backtestId2: number,
    ): CancelablePromise<BacktestDomain> {
        return BacktestsService.getBacktestOverlapV1AnalyticsBacktestOverlapBacktestId1BacktestId2Get(
            backtestId1,
            backtestId2,
        );
    }

    public static getEvaluationEntriesAnalyticsEvaluationEntryGet(
        backtestId: number,
        quantiles: Array<number>,
        splitPeriod?: string,
        orgUnits?: Array<string>,
    ): CancelablePromise<Array<EvaluationEntry>> {
        return BacktestsService.getEvaluationEntriesV1AnalyticsEvaluationEntryGet(
            backtestId,
            quantiles,
            splitPeriod,
            orgUnits,
        );
    }

    public static getActualCasesAnalyticsActualCasesBacktestIdGet(
        backtestId: number,
        orgUnits?: Array<string>,
        isDatasetId: boolean = false,
    ): CancelablePromise<DataList> {
        return BacktestsService.getActualCasesV1AnalyticsActualCasesBacktestIdGet(
            backtestId,
            orgUnits,
            isDatasetId,
        );
    }

    public static createBacktestWithDataAnalyticsCreateBacktestWithDataPost(
        requestBody: MakeBacktestWithDataRequest,
        dryRun: boolean = false,
    ): CancelablePromise<ImportSummaryResponse> {
        return BacktestsService.createBacktestWithDataV1AnalyticsCreateBacktestWithDataPost(
            requestBody,
            dryRun,
        );
    }

    public static makePredictionAnalyticsMakePredictionPost(
        requestBody: MakePredictionRequest,
    ): CancelablePromise<JobResponse> {
        return PredictionsService.makePredictionV1AnalyticsMakePredictionPost(requestBody);
    }

    public static getPredictionEntriesAnalyticsPredictionEntryPredictionIdGet(
        predictionId: number,
        quantiles: Array<number>,
    ): CancelablePromise<Array<PredictionEntry>> {
        return PredictionsService.getPredictionEntriesV1AnalyticsPredictionEntryPredictionIdGet(
            predictionId,
            quantiles,
        );
    }
}
