import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { Tooltip } from '@dhis2/ui';
import type { LeaderboardBacktestRead, MetricInfo, ReferenceModelResult } from '@dhis2-chap/ui';
import { formatComparison, formatScore, getComparisonGuidance } from '../PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { getComparisonValue, referenceName } from './referenceModels';
import styles from './ModelComparisons.module.css';

type Props = {
    metricId: string;
    metric?: MetricInfo;
    reference?: ReferenceModelResult;
    run?: LeaderboardBacktestRead;
};

export const MetricComparison = ({ metricId, metric, reference, run }: Props) => {
    const value = getComparisonValue(run, reference, metricId);
    const referenceScore = reference?.aggregateMetrics?.[metricId];
    if (!reference || value === undefined || referenceScore == null) return null;

    return (
        <Tooltip content={getComparisonGuidance(metric, referenceName(reference))}>
            <span className={cx(styles.comparison, { [styles.better]: value > 0, [styles.worse]: value < 0 })}>
                {i18n.t('{{improvement}} vs {{reference}}', {
                    improvement: formatComparison(value, metric),
                    reference: formatScore(referenceScore),
                })}
            </span>
        </Tooltip>
    );
};
