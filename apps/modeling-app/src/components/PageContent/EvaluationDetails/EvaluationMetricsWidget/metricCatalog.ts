import i18n from '@dhis2/d2-i18n';

type MetricInfo = {
    label: string;
    description: string;
    /* Expected value for metrics that are calibrated against a known target. */
    target?: number;
    unit?: string;
};

/* Demonstration and test metrics from the backend registry, not meant for users. */
export const HIDDEN_METRIC_IDS = ['example_metric', 'sample_count'];

/* Shown before the user expands the widget, in this order. */
export const HEADLINE_METRIC_IDS = ['crps', 'mae', 'rmse', 'mape', 'coverage_10_90'];

/* A value this far from its target is flagged. */
export const TARGET_TOLERANCE = 0.15;

export const getMetricInfo = (metricId: string): MetricInfo | undefined => getMetricCatalog()[metricId];

/* Fallback for metrics added to the backend that this catalog does not know yet. */
export const prettifyMetricId = (metricId: string) =>
    metricId.replace(/_/g, ' ').replace(/^./, char => char.toUpperCase());

const getMetricCatalog = (): Record<string, MetricInfo> => ({
    crps: {
        label: i18n.t('CRPS'),
        description: i18n.t('How well the whole forecast distribution matched what actually happened, not just the central estimate. Lower is better.'),
    },
    crps_log1p: {
        label: i18n.t('CRPS (log scale)'),
        description: i18n.t('CRPS measured on a log scale, so regions with few cases count as much as regions with many. Lower is better.'),
    },
    crps_norm: {
        label: i18n.t('CRPS (normalised)'),
        description: i18n.t('CRPS divided by the range of observed cases, so it can be compared across datasets of different size. Lower is better.'),
    },
    mae: {
        label: i18n.t('MAE'),
        description: i18n.t('Average size of the miss, in cases. A miss of 10 cases counts the same whether the forecast was too high or too low. Lower is better.'),
    },
    mape: {
        label: i18n.t('MAPE'),
        description: i18n.t('Average size of the miss as a share of the observed cases. Grows very large when observed cases are near zero. Lower is better.'),
        unit: '%',
    },
    rmse: {
        label: i18n.t('RMSE'),
        description: i18n.t('Like MAE, but penalises large misses much more heavily. An RMSE far above the MAE means a few periods were badly wrong. Lower is better.'),
    },
    coverage_10_90: {
        label: i18n.t('Coverage 10-90'),
        description: i18n.t('Share of observations that fell inside the 10th to 90th percentile band of the forecast. Should be close to 0.8. Much lower means the model is overconfident, much higher means it is too cautious.'),
        target: 0.8,
    },
    coverage_25_75: {
        label: i18n.t('Coverage 25-75'),
        description: i18n.t('Share of observations that fell inside the 25th to 75th percentile band of the forecast. Should be close to 0.5.'),
        target: 0.5,
    },
    ratio_above_truth: {
        label: i18n.t('Ratio above truth'),
        description: i18n.t('Share of forecast samples that landed above the observed value. Should be close to 0.5. Higher means the model forecasts too many cases, lower means too few.'),
        target: 0.5,
    },
    winkler_score_10_90: {
        label: i18n.t('Winkler score 10-90'),
        description: i18n.t('Rewards a narrow 10th to 90th percentile band, with a penalty each time the observed value falls outside it. Lower is better.'),
    },
    winkler_score_25_75: {
        label: i18n.t('Winkler score 25-75'),
        description: i18n.t('Rewards a narrow 25th to 75th percentile band, with a penalty each time the observed value falls outside it. Lower is better.'),
    },
    winkler_score_10_90_log1p: {
        label: i18n.t('Winkler score 10-90 (log scale)'),
        description: i18n.t('Winkler score for the 10th to 90th percentile band, measured on a log scale so regions with few cases count as much as regions with many. Lower is better.'),
    },
    winkler_score_25_75_log1p: {
        label: i18n.t('Winkler score 25-75 (log scale)'),
        description: i18n.t('Winkler score for the 25th to 75th percentile band, measured on a log scale so regions with few cases count as much as regions with many. Lower is better.'),
    },
    sensitivity: {
        label: i18n.t('Sensitivity'),
        description: i18n.t('Share of real outbreaks the model raised an alert for. Higher is better, but it can be raised by alerting more often.'),
    },
    specificity: {
        label: i18n.t('Specificity'),
        description: i18n.t('Share of calm periods the model correctly stayed quiet for. Higher is better, but it can be raised by alerting less often.'),
    },
    outbreak_accuracy: {
        label: i18n.t('Outbreak accuracy'),
        description: i18n.t('Share of periods correctly classified as outbreak or non-outbreak. Higher is better.'),
    },
    peak_value_diff: {
        label: i18n.t('Peak value difference'),
        description: i18n.t('Observed peak minus forecast peak, in cases. Positive means the model underestimated the peak, negative means it overestimated it.'),
    },
    peak_period_lag: {
        label: i18n.t('Peak period lag'),
        description: i18n.t('How many periods late the forecast peak was. Positive means the model predicted the peak too late, negative too early.'),
    },
});
