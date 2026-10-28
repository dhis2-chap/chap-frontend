import type { MetricInfo } from '@dhis2-chap/ui';
import { IconInfo16, Tooltip } from '@dhis2/ui';
import { getComparisonGuidance, getMetricGuidance } from '../PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import styles from './MetricInfoIcon.module.css';

type Props = {
    metric?: MetricInfo;
    /* Name of the reference the scores are compared with; the guidance then explains the comparison instead of the score. */
    comparedWith?: string;
};

export const MetricInfoIcon = ({ metric, comparedWith }: Props) => {
    const description = metric?.description?.trim();
    const guidance = comparedWith ? getComparisonGuidance(metric, comparedWith) : getMetricGuidance(metric);
    if (!description && !guidance) return null;

    return (
        <Tooltip
            content={(
                <>
                    {description && <p className={styles.paragraph}>{description}</p>}
                    {guidance && <p className={styles.paragraph}>{guidance}</p>}
                </>
            )}
        >
            <span className={styles.icon}>
                <IconInfo16 color="var(--colors-grey600)" />
            </span>
        </Tooltip>
    );
};
