import i18n from '@dhis2/d2-i18n';
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

export const formatScore = (score: number, unit?: string | null) => {
    /* Scores below 1 keep significant digits so small errors stay distinguishable instead of rounding to zero. */
    const formatted = Math.abs(score) >= 1
        ? score.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : score.toLocaleString(undefined, { maximumSignificantDigits: 3 });
    return unit ? `${formatted} ${unit}` : formatted;
};

/* Comparison values are signed because Chap Core orients every operator so positive means better than the reference. */
export const formatComparison = (value: number, metric?: MetricInfo) => {
    if (metric?.comparisonOp === 'skill_ratio') {
        return value.toLocaleString(undefined, { style: 'percent', maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
    }
    const formatted = value.toLocaleString(undefined, { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
    return metric?.unit ? `${formatted} ${metric.unit}` : formatted;
};

/* How to read a comparison with the named reference. Unknown operators fall back to the backend's own description. */
export const getComparisonGuidance = (metric: Partial<MetricInfo> | undefined, reference: string) => {
    switch (metric?.comparisonOp) {
        case 'skill_ratio':
            return i18n.t('Relative improvement over {{reference}}. +20% means 20% better than it, -20% means 20% worse.', { reference });
        case 'difference':
            return i18n.t('Improvement over {{reference}} in the units of the score. Positive means better, negative means worse.', { reference });
        case 'target_distance':
            return metric.target != null
                ? i18n.t('How much closer to the target of {{target}} than {{reference}}. Positive means better, negative means worse.', { target: formatScore(metric.target, metric.unit), reference })
                : i18n.t('How much closer to the target than {{reference}}. Positive means better, negative means worse.', { reference });
        default:
            return metric?.comparisonDescription?.trim() || i18n.t('Compared with {{reference}}. Positive means better, negative means worse.', { reference });
    }
};

/* How to read a score, from the direction or target the backend declares for the metric. */
export const getMetricGuidance = (metric?: Partial<MetricInfo>) => {
    if (metric?.target != null) {
        const target = formatScore(metric.target, metric.unit);
        return metric.targetBehavior === 'at_least'
            ? i18n.t('Higher is better, up to the target of {{target}}.', { target })
            : i18n.t('Closer to the target of {{target}} is better.', { target });
    }
    if (metric?.optimizationDirection === 'maximize') return i18n.t('Higher is better.');
    if (metric?.optimizationDirection === 'minimize') return i18n.t('Lower is better.');
    return undefined;
};
