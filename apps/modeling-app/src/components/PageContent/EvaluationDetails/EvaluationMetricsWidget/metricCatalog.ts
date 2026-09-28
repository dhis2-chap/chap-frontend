/* Demonstration and test metrics from the backend registry, not meant for users. */
export const HIDDEN_METRIC_IDS = ['example_metric', 'sample_count'];

/* Shown before the user expands the widget, in this order. */
export const HEADLINE_METRIC_IDS = ['crps_log1p', 'winkler_score_25_75_log1p', 'mae', 'rmse', 'mape', 'coverage_10_90'];

/* A value this far from its target is flagged. */
export const TARGET_TOLERANCE = 0.15;

/* Keep scores readable while metadata is loading or unavailable. */
export const prettifyMetricId = (metricId: string) =>
    metricId.replace(/_/g, ' ').replace(/^./, char => char.toUpperCase());
