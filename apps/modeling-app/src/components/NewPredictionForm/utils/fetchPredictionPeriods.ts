import i18n from '@dhis2/d2-i18n';
import { BacktestsService, PredictionSetupsService } from '@dhis2-chap/ui';
import { getLegacyBacktestParameters } from '../../NewEvaluationForm/hooks/backtestDefaults';

export const fetchPredictionPeriods = async (predictionSetupId: number, periodType: string): Promise<number> => {
    const setup = await PredictionSetupsService.getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet(predictionSetupId);
    const backtest = await BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet(setup.backtestId);
    const savedPeriods = backtest.nPeriods ?? getLegacyBacktestParameters(periodType)?.nPeriods;
    const { minPredictionPeriods, maxPredictionPeriods } = setup.configuredModel.modelTemplate;
    const minimum = minPredictionPeriods ?? 1;
    const maximum = maxPredictionPeriods ?? Infinity;

    if (savedPeriods === undefined || !Number.isInteger(savedPeriods) || savedPeriods < 1 || minimum > maximum) {
        throw new Error(i18n.t('Cannot determine a supported forecast horizon for this prediction setup. Check the evaluation and model settings.'));
    }

    return Math.min(maximum, Math.max(minimum, savedPeriods));
};
