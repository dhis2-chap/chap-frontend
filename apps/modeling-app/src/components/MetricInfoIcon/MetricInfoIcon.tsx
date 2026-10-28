import type { MetricInfo } from '@dhis2-chap/ui';
import { IconInfo16, Tooltip } from '@dhis2/ui';
import { getMetricGuidance } from '../PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import styles from './MetricInfoIcon.module.css';

export const MetricInfoIcon = ({ metric }: { metric?: MetricInfo }) => {
    const description = metric?.description?.trim();
    const guidance = getMetricGuidance(metric);
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
