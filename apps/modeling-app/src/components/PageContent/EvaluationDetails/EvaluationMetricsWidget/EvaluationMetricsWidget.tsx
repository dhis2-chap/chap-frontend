import { useState } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { useQuery } from '@tanstack/react-query';
import { LeaderboardBacktestRead, MetricInfo, ReferenceModelResult, TargetBehavior, VisualizationsService, Widget } from '@dhis2-chap/ui';
import { Button } from '@dhis2/ui';
import { useBacktestSpecification } from '@/pages/BenchmarksPage/useBacktestSpecification';
import { ChapErrorNotice } from '@/components/ChapErrorNotice';
import { MetricInfoIcon } from '@/components/MetricInfoIcon/MetricInfoIcon';
import { ReferenceModelSelector } from '@/components/ModelComparisons/ReferenceModelSelector';
import { MetricComparison } from '@/components/ModelComparisons/MetricComparison';
import { useReferenceModel } from '@/components/ModelComparisons/referenceModels';
import {
    HEADLINE_METRIC_IDS,
    HIDDEN_METRIC_IDS,
    TARGET_TOLERANCE,
    formatScore,
    getDefaultMetricIds,
    prettifyMetricId,
    sortMetricIds,
} from './metricCatalog';
import styles from './EvaluationMetricsWidget.module.css';

type Props = {
    evaluationId: number;
    specificationId?: number;
    metrics?: Record<string, number> | null;
};

const formatTarget = (target: number) => target.toLocaleString(undefined, { maximumFractionDigits: 2 });

/* Rounded before comparing, so floating point noise (0.8 - 0.65 = 0.15000000000000002) does not push a score exactly at the tolerance over it. */
const distanceFromTarget = (score: number, target: number) => Math.round(Math.abs(score - target) * 1e6) / 1e6;

type MetricRowProps = {
    metricId: string;
    score: number;
    info?: MetricInfo;
    reference?: ReferenceModelResult;
    run?: LeaderboardBacktestRead;
};

const MetricRow = ({ metricId, score, info, reference, run }: MetricRowProps) => {
    const target = info?.target;
    const label = info?.displayName?.trim() || prettifyMetricId(metricId);
    /* The tolerance is an absolute distance, so a zero target on a raw-unit metric like peak value difference would flag a miss of 0.15 cases. */
    const offTarget = Number.isFinite(score) &&
        target != null && target !== 0 &&
        (info?.targetBehavior !== TargetBehavior.AT_LEAST || score < target) &&
        distanceFromTarget(score, target) > TARGET_TOLERANCE;

    return (
        <div className={styles.row}>
            <span className={styles.label}>
                {label}
                <MetricInfoIcon metric={info} />
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
                <MetricComparison metricId={metricId} metric={info} reference={reference} run={run} />
            </span>
        </div>
    );
};

export const EvaluationMetricsWidget = ({ evaluationId, specificationId, metrics }: Props) => {
    const [expanded, setExpanded] = useState(false);
    // Include archived and comparison models so every evaluation gets its comparisons.
    const specification = useBacktestSpecification(specificationId ?? 0, true, true);
    const { references, reference, select } = useReferenceModel(specification.data);
    const run = specification.data?.backtests.find(item => item.id === evaluationId);
    // Chap Core lists reference runs under baselines, not backtests, so a reference model's own evaluation has nothing to compare with.
    const isReferenceRun = references.some(item => item.backtestId === evaluationId);
    const { data: fallbackCatalog } = useQuery({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId),
        enabled: Object.keys(metrics ?? {}).length > 0 && !specification.isInitialLoading && !specification.data?.metrics,
        staleTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
    });
    const metricCatalog = specification.data?.metrics ?? fallbackCatalog;
    const metricInfoById = new Map(metricCatalog?.map(info => [info.id, info]));

    const visibleIds = sortMetricIds(
        Object.keys(metrics ?? {}).filter(metricId => !HIDDEN_METRIC_IDS.includes(metricId)),
        metricCatalog,
    );
    const defaultIds = getDefaultMetricIds(visibleIds, metricCatalog);
    /* An evaluation can report only metrics outside the defaults, and the collapsed widget must still show rows. */
    const collapsedIds = defaultIds.length > 0 ? defaultIds : visibleIds.slice(0, HEADLINE_METRIC_IDS.length);
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
                        {specification.isError && (
                            <ChapErrorNotice error={specification.error} title={i18n.t('Could not load comparisons')} />
                        )}
                        {specification.data?.baselines !== undefined && !isReferenceRun && (
                            <ReferenceModelSelector
                                references={references}
                                reference={reference}
                                onSelect={select}
                            />
                        )}
                        <div className={styles.rows}>
                            {shownIds.map(metricId => (
                                <MetricRow
                                    key={metricId}
                                    metricId={metricId}
                                    info={metricInfoById.get(metricId)}
                                    score={(metrics ?? {})[metricId]}
                                    reference={reference}
                                    run={run}
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
