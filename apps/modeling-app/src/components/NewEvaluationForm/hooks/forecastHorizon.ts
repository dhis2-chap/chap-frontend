import i18n from '@dhis2/d2-i18n';
import type { ConfiguredModelInfoRead } from '@dhis2-chap/ui';

export const getForecastHorizonError = (model: ConfiguredModelInfoRead, nPeriods: number | undefined) => {
    // Basic number validation is handled by the backtest parameter schema.
    if (nPeriods == null || !Number.isInteger(nPeriods) || nPeriods <= 0) return undefined;

    const { minPredictionPeriods: minimum, maxPredictionPeriods: maximum } = model.modelTemplate;
    if ((minimum == null || nPeriods >= minimum) && (maximum == null || nPeriods <= maximum)) {
        return undefined;
    }

    const name = model.displayName || model.name;
    if (minimum != null && maximum != null) {
        return i18n.t('{{model}} supports {{minimum}}–{{maximum}} forecast periods. The evaluation uses {{nPeriods}}.', {
            model: name, minimum, maximum, nPeriods,
        });
    }
    if (minimum != null) {
        return i18n.t('{{model}} requires at least {{minimum}} forecast periods. The evaluation uses {{nPeriods}}.', {
            model: name, minimum, nPeriods,
        });
    }
    return i18n.t('{{model}} supports at most {{maximum}} forecast periods. The evaluation uses {{nPeriods}}.', {
        model: name, maximum, nPeriods,
    });
};
