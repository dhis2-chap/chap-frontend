import type { BackTest } from '../models/BackTest';
import type { BackTestRead } from '../models/BackTestRead';
import type { BackTestUpdate } from '../models/BackTestUpdate';
import type { ConfiguredModelDB } from '../models/ConfiguredModelDB';
import type { ModelConfigurationCreate } from '../models/ModelConfigurationCreate';
import type { ModelSpecRead } from '../models/ModelSpecRead';
import type { ModelTemplateRead } from '../models/ModelTemplateRead';
import type { PredictionInfo } from '../models/PredictionInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { BacktestsService } from './BacktestsService';
import { ModelsService } from './ModelsService';
import { PredictionsService } from './PredictionsService';

export class CrudService {
    public static getBacktestsCrudBacktestsGet(): CancelablePromise<Array<BackTestRead>> {
        return BacktestsService.getBacktestsV1CrudBacktestsGet();
    }

    public static getBacktestCrudBacktestsBacktestIdFullGet(
        backtestId: number,
    ): CancelablePromise<BackTest> {
        return BacktestsService.getBacktestV1CrudBacktestsBacktestIdFullGet(backtestId);
    }

    public static getBacktestInfoCrudBacktestsBacktestIdInfoGet(
        backtestId: number,
    ): CancelablePromise<BackTestRead> {
        return BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet(backtestId);
    }

    public static deleteBacktestBatchCrudBacktestsDelete(
        ids: string,
    ): CancelablePromise<any> {
        return BacktestsService.deleteBacktestBatchV1CrudBacktestsDelete(ids);
    }

    public static deleteBacktestCrudBacktestsBacktestIdDelete(
        backtestId: number,
    ): CancelablePromise<any> {
        return BacktestsService.deleteBacktestV1CrudBacktestsBacktestIdDelete(backtestId);
    }

    public static updateBacktestCrudBacktestsBacktestIdPatch(
        backtestId: number,
        requestBody: BackTestUpdate,
    ): CancelablePromise<BackTestRead> {
        return BacktestsService.updateBacktestV1CrudBacktestsBacktestIdPatch(backtestId, requestBody);
    }

    public static getPredictionsCrudPredictionsGet(): CancelablePromise<Array<PredictionInfo>> {
        return PredictionsService.getPredictionsV1CrudPredictionsGet();
    }

    public static getPredictionCrudPredictionsPredictionIdGet(
        predictionId: number,
    ): CancelablePromise<PredictionInfo> {
        return PredictionsService.getPredictionV1CrudPredictionsPredictionIdGet(predictionId);
    }

    public static deletePredictionCrudPredictionsPredictionIdDelete(
        predictionId: number,
    ): CancelablePromise<any> {
        return PredictionsService.deletePredictionV1CrudPredictionsPredictionIdDelete(predictionId);
    }

    public static listModelTemplatesCrudModelTemplatesGet(): CancelablePromise<Array<ModelTemplateRead>> {
        return ModelsService.listModelTemplatesV1CrudModelTemplatesGet();
    }

    public static listConfiguredModelsCrudConfiguredModelsGet(): CancelablePromise<Array<ModelSpecRead>> {
        return ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet();
    }

    public static addModelCrudModelsPost(
        requestBody: ModelConfigurationCreate,
    ): CancelablePromise<ConfiguredModelDB> {
        return ModelsService.addModelV1CrudModelsPost(requestBody);
    }

    public static deleteConfiguredModelCrudConfiguredModelsConfiguredModelIdDelete(
        configuredModelId: number,
    ): CancelablePromise<any> {
        return ModelsService.deleteConfiguredModelV1CrudConfiguredModelsConfiguredModelIdDelete(
            configuredModelId,
        );
    }
}
