import i18n from '@dhis2/d2-i18n';
import type { AlertLevel } from '@dhis2-chap/ui';
import { fractionToPercentString } from '@/utils/thresholdStrategyParams';

// Alert levels describe a single threshold line, so list values hold one number.
export const single = (value?: number | number[]) => (Array.isArray(value) ? value[0] : value);

const describeThreshold = (params: AlertLevel['thresholdParams']) => {
    if ('quantile' in params) {
        const percentile = fractionToPercentString(single(params.quantile) ?? 0);
        return params.baselineYears == null
            ? i18n.t('{{percentile}}th percentile, all history', { percentile })
            : i18n.t('{{percentile}}th percentile, {{count}}-year baseline', {
                    percentile,
                    count: params.baselineYears,
                });
    }
    return i18n.t('mean + {{stdMultiplier}} SD', {
        stdMultiplier: single('stdMultiplier' in params ? params.stdMultiplier : undefined),
    });
};

export const describeAlertLevel = (level: AlertLevel) => i18n.t(
    '{{name}} · {{threshold}} · ≥{{probability}}%',
    {
        name: level.name,
        threshold: describeThreshold(level.thresholdParams),
        probability: Math.round(level.exceedanceThreshold * 100),
    },
);
