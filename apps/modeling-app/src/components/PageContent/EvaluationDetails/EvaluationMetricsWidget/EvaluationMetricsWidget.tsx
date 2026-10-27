import { useState } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { useQuery } from '@tanstack/react-query';
import { LeaderboardBacktestRead, MetricInfo, ReferenceModelResult, TargetBehavior, VisualizationsService, Widget } from '@dhis2-chap/ui';
import { Button, IconInfo16, NoticeBox, Tooltip } from '@dhis2/ui';
import { useBacktestSpecification } from '@/pages/BenchmarksPage/useBacktestSpecification';
import { ReferenceModelSelector } from '@/components/ModelComparisons/ReferenceModelSelector';
import { MetricComparison } from '@/components/ModelComparisons/MetricComparison';
import { getReferenceModels, getSelectedReference } from '@/components/ModelComparisons/referenceModels';
import {
    HEADLINE_METRIC_IDS,
    HIDDEN_METRIC_IDS,
    TARGET_TOLERANCE,
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
                <MetricComparison metricId={metricId} metric={info} reference={reference} run={run} />
            </span>
        </div>
    );
};

export const EvaluationMetricsWidget = ({ evaluationId, specificationId, metrics }: Props) => {
    const [expanded, setExpanded] = useState(false);
    const [includeComparisonModels, setIncludeComparisonModels] = useState(false);
    const [selectedReferenceId, setSelectedReferenceId] = useState<string>();
    // Include archived models so an archived evaluation still gets its comparisons.
    const specification = useBacktestSpecification(specificationId ?? 0, true, includeComparisonModels);
    const references = getReferenceModels(specification.data, includeComparisonModels);
    const reference = getSelectedReference(references, selectedReferenceId, specification.data?.defaultBaselineModel);
    const run = specification.data?.backtests.find(item => item.id === evaluationId);
    const { data: fallbackCatalog } = useQuery({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId),
        enabled: Object.keys(metrics ?? {}).length > 0 && !specification.data?.metrics,
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
                        {specificationId != null && specification.isInitialLoading && (
                            <p className={styles.intro}>{i18n.t('Loading comparisons…')}</p>
                        )}
                        {specification.isError && (
                            <NoticeBox warning title={i18n.t('Comparisons unavailable')}>
                                {i18n.t('Evaluation scores are still available.')}
                                <Button small onClick={() => specification.refetch()}>{i18n.t('Retry')}</Button>
                                {includeComparisonModels && (
                                    <Button small onClick={() => setIncludeComparisonModels(false)}>{i18n.t('Hide comparison models')}</Button>
                                )}
                            </NoticeBox>
                        )}
                        {specification.data?.baselines !== undefined && (
                            <ReferenceModelSelector
                                references={references}
                                reference={reference}
                                onSelect={setSelectedReferenceId}
                                includeComparisonModels={includeComparisonModels}
                                onIncludeComparisonModels={setIncludeComparisonModels}
                                loading={specification.isFetching}
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
