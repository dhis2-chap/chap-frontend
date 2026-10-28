import { useState } from 'react';
import { Link } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import { useQuery } from '@tanstack/react-query';
import {
    type ApiError, DataDimension, MetricsService, OpenAPI, Widget,
    type OutbreakMetricInfo, type OutbreakMetricsRow,
} from '@dhis2-chap/ui';
import {
    Button, CheckboxField, CircularLoader, DataTable, DataTableBody, DataTableCell,
    DataTableColumnHeader, DataTableHead, DataTableRow,
    IconInfo16, SingleSelectField, SingleSelectOption, Tooltip,
} from '@dhis2/ui';
import { useAlertPolicies } from '@/hooks/useAlertPolicies';
import { Features, useIsFeatureAvailable } from '@/hooks/useIsFeatureAvailable';
import { ChapErrorNotice } from '@/components/ChapErrorNotice';
import { describeAlertLevel } from '@/components/BackendAlerts/describeAlertLevel';
import styles from './OutbreakMetricsWidget.module.css';

const HEADLINE_METRIC_IDS = ['sensitivity', 'ppv', 'specificity', 'f1'];

const formatScore = (value: number | null | undefined) => (
    value != null && Number.isFinite(value)
        ? value.toLocaleString(undefined, { maximumFractionDigits: 3 })
        : i18n.t('Not defined')
);

const MetricLabel = ({ metric }: { metric: OutbreakMetricInfo }) => (
    <span className={styles.metricLabel}>
        {metric.displayName}
        {metric.description?.trim() && (
            <Tooltip content={metric.description}>
                <IconInfo16 color="var(--colors-grey600)" />
            </Tooltip>
        )}
    </span>
);

type ScoresProps = {
    row: OutbreakMetricsRow;
    binaryMetrics: OutbreakMetricInfo[];
    categoricalMetrics: OutbreakMetricInfo[];
};

const Scores = ({ row, binaryMetrics, categoricalMetrics }: ScoresProps) => (
    <div className={styles.result}>
        <div className={styles.resultHeading}>
            <h3>
                {row.horizonDistance == null
                    ? i18n.t('All forecast horizons')
                    : i18n.t('Horizon {{horizon}}', { horizon: row.horizonDistance })}
            </h3>
            <span>
                {i18n.t('{{count}} forecast case scored', {
                    count: row.nCells,
                    defaultValue_plural: '{{count}} forecast cases scored',
                })}
            </span>
        </div>
        <div className={styles.table}>
            <DataTable>
                <DataTableHead>
                    <DataTableRow>
                        <DataTableColumnHeader>{i18n.t('Alert level')}</DataTableColumnHeader>
                        {binaryMetrics.map(metric => (
                            <DataTableColumnHeader key={metric.id} align="right">
                                <MetricLabel metric={metric} />
                            </DataTableColumnHeader>
                        ))}
                    </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                    {row.levels.map(level => (
                        <DataTableRow key={level.level}>
                            <DataTableCell>{level.level}</DataTableCell>
                            {binaryMetrics.map(metric => (
                                <DataTableCell key={metric.id} align="right">
                                    {formatScore(level.metrics[metric.id])}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
        </div>
        <div className={styles.policyScores}>
            <strong>{i18n.t('Policy overall')}</strong>
            {categoricalMetrics.map(metric => (
                <span key={metric.id} className={styles.policyScore}>
                    <MetricLabel metric={metric} />
                    <strong>{formatScore(row.categorical[metric.id])}</strong>
                </span>
            ))}
        </div>
    </div>
);

export const OutbreakMetricsWidget = ({ evaluationId }: { evaluationId: number }) => {
    const { isAvailable } = useIsFeatureAvailable(Features.OUTBREAK_METRICS);
    return isAvailable ? <OutbreakMetricsContent key={evaluationId} evaluationId={evaluationId} /> : null;
};

const OutbreakMetricsContent = ({ evaluationId }: { evaluationId: number }) => {
    const [policyId, setPolicyId] = useState('');
    const [byHorizon, setByHorizon] = useState(false);
    const [beforeFirstSplit, setBeforeFirstSplit] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const policies = useAlertPolicies();
    const policy = policies.data?.find(item => String(item.id) === policyId);
    const catalog = useQuery<OutbreakMetricInfo[], ApiError>({
        queryKey: ['outbreak-metric-catalog', OpenAPI.BASE],
        queryFn: () => MetricsService.listOutbreakMetricsV1AnalyticsOutbreakMetricsGet(),
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const scores = useQuery({
        queryKey: ['outbreak-metrics', OpenAPI.BASE, evaluationId, policy?.id, byHorizon, beforeFirstSplit],
        queryFn: () => MetricsService.getOutbreakMetricsV1AnalyticsBacktestsBacktestIdOutbreakMetricsGet(
            evaluationId, policy!.id,
            byHorizon ? [DataDimension.HORIZON_DISTANCE] : undefined,
            beforeFirstSplit,
        ),
        enabled: !!policy && !!catalog.data,
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Development builds can report the next version before the endpoint lands.
    if (catalog.error?.status === 404) return null;

    const binaryMetrics = catalog.data?.filter(metric => (
        metric.kind === 'binary' && (showAll || HEADLINE_METRIC_IDS.includes(metric.id))
    )) ?? [];
    const categoricalMetrics = (catalog.data?.filter(metric => metric.kind === 'categorical') ?? [])
        .sort((a, b) => Number(a.id === 'accuracy') - Number(b.id === 'accuracy'));
    const setupError = catalog.error ?? policies.error;

    return (
        <Widget header={i18n.t('Outbreak detection')} noncollapsible>
            <div className={styles.content} data-test="outbreak-metrics">
                <p className={styles.intro}>
                    {i18n.t('Scores aggregated across all evaluation splits and organisation units.')}
                </p>
                {setupError ? (
                    <ChapErrorNotice error={setupError} title={i18n.t('Could not load outbreak scoring')}>
                        <Button
                            small
                            onClick={() => {
                                void catalog.refetch();
                                void policies.refetch();
                            }}
                        >
                            {i18n.t('Retry')}
                        </Button>
                    </ChapErrorNotice>
                ) : policies.isLoading || catalog.isLoading ? <CircularLoader small /> : !policies.data?.length ? (
                    <p className={styles.intro}>
                        {i18n.t('No alert policies yet.')}
                        {' '}
                        <Link to="/alerts">{i18n.t('Manage alert policies')}</Link>
                    </p>
                ) : (
                    <>
                        <SingleSelectField
                            label={i18n.t('Alert policy')}
                            placeholder={i18n.t('Select an alert policy')}
                            selected={policy?.id == null ? '' : String(policy.id)}
                            onChange={({ selected }) => setPolicyId(selected)}
                            dataTest="outbreak-policy"
                        >
                            {policies.data.map(item => <SingleSelectOption key={item.id} value={String(item.id)} label={item.name} />)}
                        </SingleSelectField>
                        <CheckboxField
                            label={i18n.t('Split by forecast horizon')}
                            checked={byHorizon}
                            onChange={({ checked }) => setByHorizon(checked)}
                            dataTest="outbreak-by-horizon"
                        />
                        <CheckboxField
                            label={i18n.t('Calculate thresholds from data before the first forecast only')}
                            checked={beforeFirstSplit}
                            onChange={({ checked }) => setBeforeFirstSplit(checked)}
                        />
                        {policy && (
                            <>
                                <ul className={styles.levels}>
                                    {policy.levels?.map(level => <li key={level.name}>{describeAlertLevel(level)}</li>)}
                                </ul>
                                {scores.isFetching ? (
                                    <CircularLoader small />
                                ) : scores.error ? (
                                    <ChapErrorNotice error={scores.error as ApiError} title={i18n.t('Could not score outbreak detection')}>
                                        <Button small onClick={() => void scores.refetch()}>{i18n.t('Retry')}</Button>
                                    </ChapErrorNotice>
                                ) : scores.data && (
                                    !scores.data.rows.some(row => row.nCells > 0) ? <p className={styles.intro}>{i18n.t('No forecast cases to score.')}</p> : (
                                        <>
                                            {scores.data.rows.map(row => (
                                                <Scores
                                                    key={row.horizonDistance ?? 'overall'}
                                                    row={row}
                                                    binaryMetrics={binaryMetrics}
                                                    categoricalMetrics={categoricalMetrics}
                                                />
                                            ))}
                                            <Button small secondary onClick={() => setShowAll(!showAll)}>
                                                {showAll ? i18n.t('Show fewer metrics') : i18n.t('Show all metrics')}
                                            </Button>
                                        </>
                                    )
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </Widget>
    );
};
