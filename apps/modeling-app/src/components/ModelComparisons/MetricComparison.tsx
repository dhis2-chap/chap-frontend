import i18n from '@dhis2/d2-i18n';
import { IconInfo16, Tooltip } from '@dhis2/ui';
import type { LeaderboardBacktestRead, MetricInfo, ReferenceModelResult } from '@dhis2-chap/ui';
import styles from './ModelComparisons.module.css';

type Props = {
    metricId: string;
    metric?: MetricInfo;
    reference?: ReferenceModelResult;
    run?: LeaderboardBacktestRead;
};

export const MetricComparison = ({ metricId, metric, reference, run }: Props) => {
    if (!reference || reference.status !== 'done') return null;
    const referenceScore = reference.aggregateMetrics?.[metricId];
    const value = run?.comparisons?.find(comparison => comparison.configuredModelId === reference.configuredModel.id)?.values[metricId];
    const sameModel = run?.configuredModel?.id === reference.configuredModel.id;
    const formatted = typeof value === 'number' && Number.isFinite(value)
        ? value.toLocaleString(undefined, metric?.comparisonOp === 'skill_ratio'
                ? { style: 'percent', maximumSignificantDigits: 3, signDisplay: 'exceptZero' }
                : { maximumSignificantDigits: 3, signDisplay: 'exceptZero' })
        : undefined;
    const unit = metric?.comparisonOp === 'difference' || metric?.comparisonOp === 'target_distance' ? metric.unit : undefined;

    return (
        <span className={styles.scores}>
            <span>
                {i18n.t('Reference {{score}}', {
                    score: referenceScore != null && Number.isFinite(referenceScore)
                        ? `${referenceScore.toLocaleString(undefined, { maximumSignificantDigits: 6 })}${metric?.unit ? ` ${metric.unit}` : ''}`
                        : i18n.t('Not available'),
                })}
            </span>
            <span className={styles.improvement}>
                {sameModel ? i18n.t('Same model') : formatted !== undefined
                    ? i18n.t('Improvement {{value}}', { value: `${formatted}${unit ? ` ${unit}` : ''}` })
                    : value === null ? i18n.t('Comparison undefined') : i18n.t('Comparison unavailable')}
                {metric?.comparisonDescription && (
                    <Tooltip content={metric.comparisonDescription}>
                        <span className={styles.infoIcon} tabIndex={0}><IconInfo16 color="var(--colors-grey600)" /></span>
                    </Tooltip>
                )}
            </span>
        </span>
    );
};
