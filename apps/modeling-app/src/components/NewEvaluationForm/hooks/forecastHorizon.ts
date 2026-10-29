import i18n from '@dhis2/d2-i18n';
import type { ConfiguredModelInfoRead } from '@dhis2-chap/ui';

export const getForecastHorizonError = (model: ConfiguredModelInfoRead, nPeriods: number | undefined) => {
    // Basic number validation is handled by the backtest parameter schema.
    if (nPeriods == null || !Number.isInteger(nPeriods) || nPeriods <= 0) return undefined;

    // Older Chap Core releases only return the deprecated *PredictionLength names.
    const minimum = model.modelTemplate.minPredictionPeriods ?? model.modelTemplate.minPredictionLength;
    const maximum = model.modelTemplate.maxPredictionPeriods ?? model.modelTemplate.maxPredictionLength;
    if ((minimum == null || nPeriods >= minimum) && (maximum == null || nPeriods <= maximum)) {
        return undefined;
    }

    const name = model.displayName || model.name;
    if (minimum != null && maximum != null) {
        return i18n.t('{{model}} supports {{minimum}}–{{maximum}} forecast periods.', {
            model: name, minimum, maximum,
        });
    }
    if (minimum != null) {
        return i18n.t('{{model}} requires at least {{minimum}} forecast periods.', {
            model: name, minimum,
        });
    }
    return i18n.t('{{model}} supports at most {{maximum}} forecast periods.', {
        model: name, maximum,
    });
};
