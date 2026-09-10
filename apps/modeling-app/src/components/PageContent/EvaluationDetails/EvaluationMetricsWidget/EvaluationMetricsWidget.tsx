import { useState } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { Widget } from '@dhis2-chap/ui';
import { Button, IconInfo16, Tooltip } from '@dhis2/ui';
import {
    HEADLINE_METRIC_IDS,
    HIDDEN_METRIC_IDS,
    TARGET_TOLERANCE,
    getMetricInfo,
    prettifyMetricId,
} from './metricCatalog';
import styles from './EvaluationMetricsWidget.module.css';

type Props = {
    metrics?: Record<string, number> | null;
};

const formatScore = (score: number, unit?: string) => {
    const formatted = score.toLocaleString(undefined, {
        maximumFractionDigits: Math.abs(score) >= 1 ? 2 : 3,
    });
    return unit ? `${formatted} ${unit}` : formatted;
};

const formatTarget = (target: number) => target.toLocaleString(undefined, { maximumFractionDigits: 2 });

const sortMetricIds = (metricIds: string[]) =>
    [...metricIds].sort((a, b) => {
        const indexA = HEADLINE_METRIC_IDS.indexOf(a);
        const indexB = HEADLINE_METRIC_IDS.indexOf(b);
        if (indexA !== -1 || indexB !== -1) {
            return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
        }
        return a.localeCompare(b);
    });

type MetricRowProps = {
    metricId: string;
    score: number;
};

const MetricRow = ({ metricId, score }: MetricRowProps) => {
    const info = getMetricInfo(metricId);
    const label = info?.label ?? prettifyMetricId(metricId);
    const offTarget = info?.target !== undefined && Math.abs(score - info.target) > TARGET_TOLERANCE;

    return (
        <div className={styles.row}>
            <span className={styles.label}>
                {label}
                {info && (
                    <Tooltip content={info.description}>
                        <span className={styles.infoIcon}>
                            <IconInfo16 color="var(--colors-grey600)" />
                        </span>
                    </Tooltip>
                )}
            </span>
            <span className={styles.valueGroup}>
                <span className={cx(styles.value, { [styles.offTarget]: offTarget })}>
                    {Number.isFinite(score) ? formatScore(score, info?.unit) : i18n.t('Not available')}
                </span>
                {info?.target !== undefined && (
                    <span className={styles.target}>
                        {i18n.t('target {{target}}', { target: formatTarget(info.target) })}
                    </span>
                )}
            </span>
        </div>
    );
};

export const EvaluationMetricsWidget = ({ metrics }: Props) => {
    const [expanded, setExpanded] = useState(false);

    const visibleIds = sortMetricIds(
        Object.keys(metrics ?? {}).filter(metricId => !HIDDEN_METRIC_IDS.includes(metricId)),
    );
    const shownIds = expanded ? visibleIds : visibleIds.filter(metricId => HEADLINE_METRIC_IDS.includes(metricId));
    const hiddenCount = visibleIds.length - shownIds.length;

    return (
        <Widget header={i18n.t('Evaluation metrics')} noncollapsible>
            <div className={styles.content}>
                {visibleIds.length === 0 ? (
                    <p className={styles.intro}>
                        {i18n.t('No metrics available for this evaluation.')}
                    </p>
                ) : (
                    <>
                        <p className={styles.intro}>
                            {i18n.t('Scores aggregated across all evaluation splits and organisation units.')}
                        </p>
                        <div className={styles.rows}>
                            {shownIds.map(metricId => (
                                <MetricRow
                                    key={metricId}
                                    metricId={metricId}
                                    score={(metrics ?? {})[metricId]}
                                />
                            ))}
                        </div>
                        {(expanded || hiddenCount > 0) && (
                            <Button small secondary onClick={() => setExpanded(!expanded)}>
                                {expanded
                                    ? i18n.t('Show fewer metrics')
                                    : i18n.t('Show all {{count}} metrics', { count: visibleIds.length })}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </Widget>
    );
};
