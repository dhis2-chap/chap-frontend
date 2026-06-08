import i18n from '@dhis2/d2-i18n';
import type { QuantileKey } from '@dhis2-chap/ui';

export const DATASTORE_NAMESPACE = 'chap-dashboard-plugin';
export const CONFIG_VERSION = 1;
export const FALLBACK_MONTH_COUNT = 24;

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
