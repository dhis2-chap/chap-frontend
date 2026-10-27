import type { MetricInfo } from '@dhis2-chap/ui';

/* Demonstration and test metrics from the backend registry, not meant for users. */
export const HIDDEN_METRIC_IDS = ['example_metric', 'sample_count'];

/* Shown by default on Chap Core versions without configurable metric defaults, in this order. */
export const HEADLINE_METRIC_IDS = ['crps_log1p', 'winkler_score_25_75_log1p', 'mae', 'rmse', 'mape', 'coverage_10_90'];

/* A value this far from its target is flagged. */
export const TARGET_TOLERANCE = 0.15;

/* Keep scores readable while metadata is loading or unavailable. */
export const prettifyMetricId = (metricId: string) =>
    metricId.replace(/_/g, ' ').replace(/^./, char => char.toUpperCase());

/* Configured order first, then the built-in headline order, then alphabetically. */
export const sortMetricIds = (metricIds: string[], catalog?: MetricInfo[]) => {
    const rank = (metricId: string) => {
        const configured = catalog?.find(metric => metric.id === metricId)?.sortOrder;
        if (configured != null) return configured;
        const headline = HEADLINE_METRIC_IDS.indexOf(metricId);
        return headline === -1 ? Infinity : 1e6 + headline;
    };
    return [...metricIds].sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b));
};

/* Metrics selected in the modeling defaults, falling back to the headline metrics on older Chap Core versions. */
export const getDefaultMetricIds = (metricIds: string[], catalog?: MetricInfo[]) => {
    const selected = metricIds.filter(metricId => catalog?.find(metric => metric.id === metricId)?.isSelected);
    return selected.length > 0 ? selected : metricIds.filter(metricId => HEADLINE_METRIC_IDS.includes(metricId));
};
