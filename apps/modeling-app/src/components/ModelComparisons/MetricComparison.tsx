import i18n from '@dhis2/d2-i18n';
import { Tooltip } from '@dhis2/ui';
import type { LeaderboardBacktestRead, MetricInfo, ReferenceModelResult } from '@dhis2-chap/ui';
import { formatScore } from '../PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import styles from './ModelComparisons.module.css';

type Props = {
    metricId: string;
    metric?: MetricInfo;
    reference?: ReferenceModelResult;
    run?: LeaderboardBacktestRead;
};

const formatImprovement = (value: number, metric?: MetricInfo) => {
    if (metric?.comparisonOp === 'skill_ratio') {
        return value.toLocaleString(undefined, { style: 'percent', maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
    }
    const formatted = value.toLocaleString(undefined, { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
    return metric?.unit ? `${formatted} ${metric.unit}` : formatted;
};

/* Chap Core only compares a run with references that are done and are not the run's own model, so a missing value means no comparison. */
export const MetricComparison = ({ metricId, metric, reference, run }: Props) => {
    const value = run?.comparisons?.find(comparison => comparison.configuredModelId === reference?.configuredModel.id)?.values[metricId];
    const referenceScore = reference?.aggregateMetrics?.[metricId];
    if (typeof value !== 'number' || !Number.isFinite(value) || referenceScore == null) return null;

    const label = (
        <span className={styles.comparison}>
            {i18n.t('{{improvement}} vs {{reference}}', {
                improvement: formatImprovement(value, metric),
                reference: formatScore(referenceScore),
            })}
        </span>
    );
    return metric?.comparisonDescription ? <Tooltip content={metric.comparisonDescription}>{label}</Tooltip> : label;
};
