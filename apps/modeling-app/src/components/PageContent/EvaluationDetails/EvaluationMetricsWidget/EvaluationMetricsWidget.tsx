import { useState } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { useQuery } from '@tanstack/react-query';
import { MetricInfo, VisualizationsService, Widget } from '@dhis2-chap/ui';
import { Button, IconInfo16, Tooltip } from '@dhis2/ui';
import {
    HEADLINE_METRIC_IDS,
    HIDDEN_METRIC_IDS,
    TARGET_TOLERANCE,
    prettifyMetricId,
} from './metricCatalog';
import styles from './EvaluationMetricsWidget.module.css';

type Props = {
    evaluationId: number;
    metrics?: Record<string, number> | null;
};

const formatScore = (score: number, unit?: string | null) => {
    /* Scores below 1 keep significant digits so small errors stay distinguishable instead of rounding to zero. */
    const formatted = Math.abs(score) >= 1
        ? score.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : score.toLocaleString(undefined, { maximumSignificantDigits: 3 });
    return unit ? `${formatted} ${unit}` : formatted;
};

const formatTarget = (target: number) => target.toLocaleString(undefined, { maximumFractionDigits: 2 });

/* Rounded before comparing, so floating point noise (0.8 - 0.65 = 0.15000000000000002) does not push a score exactly at the tolerance over it. */
const distanceFromTarget = (score: number, target: number) => Math.round(Math.abs(score - target) * 1e6) / 1e6;

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
    info?: MetricInfo;
};

const MetricRow = ({ metricId, score, info }: MetricRowProps) => {
    const target = info?.target;
    const label = info?.displayName?.trim() || prettifyMetricId(metricId);
    const offTarget = Number.isFinite(score) &&
        target != null &&
        (info?.targetBehavior !== 'at_least' || score < target) &&
        distanceFromTarget(score, target) > TARGET_TOLERANCE;

    return (
        <div className={styles.row}>
            <span className={styles.label}>
                {label}
                {info?.description?.trim() && (
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
                {target != null && (
                    <span className={styles.target}>
                        {i18n.t('target {{target}}', { target: formatTarget(target) })}
                    </span>
                )}
            </span>
        </div>
    );
};

export const EvaluationMetricsWidget = ({ evaluationId, metrics }: Props) => {
    const [expanded, setExpanded] = useState(false);
    const { data: metricCatalog } = useQuery({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId),
        enabled: Object.keys(metrics ?? {}).length > 0,
        staleTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
    });
    const metricInfoById = new Map(metricCatalog?.map(info => [info.id, info]));

    const visibleIds = sortMetricIds(
        Object.keys(metrics ?? {}).filter(metricId => !HIDDEN_METRIC_IDS.includes(metricId)),
    );
    const headlineIds = visibleIds.filter(metricId => HEADLINE_METRIC_IDS.includes(metricId));
    /* An evaluation can report only metrics this catalog has no headline for, and the collapsed widget must still show rows. */
    const collapsedIds = headlineIds.length > 0 ? headlineIds : visibleIds.slice(0, HEADLINE_METRIC_IDS.length);
    const shownIds = expanded ? visibleIds : collapsedIds;
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
                                    info={metricInfoById.get(metricId)}
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
