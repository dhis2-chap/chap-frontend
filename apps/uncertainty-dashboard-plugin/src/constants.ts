import i18n from '@dhis2/d2-i18n';
import { PERIOD_TYPES } from '@dhis2-chap/core';
import type { QuantileKey } from '@dhis2-chap/ui';

export const DATASTORE_NAMESPACE = 'chap-dashboard-plugin';
export const CONFIG_VERSION = 1;
export const DEFAULT_CHART_PERIOD_TYPE = PERIOD_TYPES.MONTH;
export const FALLBACK_PERIOD_COUNTS = {
    [PERIOD_TYPES.MONTH]: 24,
    [PERIOD_TYPES.WEEK]: 104,
} as const;

export const QUANTILE_FIELDS: Array<{
    key: QuantileKey;
    label: string;
    suggestedKeyword: string;
}> = [
    {
        key: 'quantile_low',
        label: i18n.t('Quantile 0.1'),
        suggestedKeyword: 'low',
    },
    {
        key: 'quantile_mid_low',
        label: i18n.t('Quantile 0.25'),
        suggestedKeyword: 'mid low',
    },
    {
        key: 'median',
        label: i18n.t('Median'),
        suggestedKeyword: 'median',
    },
    {
        key: 'quantile_mid_high',
        label: i18n.t('Quantile 0.75'),
        suggestedKeyword: 'mid high',
    },
    {
        key: 'quantile_high',
        label: i18n.t('Quantile 0.9'),
        suggestedKeyword: 'high',
    },
];
