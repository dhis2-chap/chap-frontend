import i18n from '@dhis2/d2-i18n';
import { BacktestsService, PredictionSetupsService } from '@dhis2-chap/ui';
import { getLegacyBacktestParameters } from '../../NewEvaluationForm/hooks/backtestDefaults';

/** The evaluation's saved forecast horizon, kept within the range the model supports. */
export const fetchPredictionPeriods = async (predictionSetupId: number, periodType: string): Promise<number> => {
    const setup = await PredictionSetupsService.getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet(predictionSetupId);
    const backtest = await BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet(setup.backtestId);
    const savedPeriods = backtest.nPeriods ?? getLegacyBacktestParameters(periodType)?.nPeriods;
    if (savedPeriods === undefined) {
        throw new Error(i18n.t('Cannot determine a forecast horizon for this prediction setup.'));
    }

    const { minPredictionPeriods, maxPredictionPeriods } = setup.configuredModel.modelTemplate;
    return Math.min(maxPredictionPeriods ?? Infinity, Math.max(minPredictionPeriods ?? 1, savedPeriods));
};
