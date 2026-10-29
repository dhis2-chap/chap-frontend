import { useState } from 'react';
import { Link } from 'react-router-dom';
import i18n from '@dhis2/d2-i18n';
import { useQuery } from '@tanstack/react-query';
import {
    type AlertLevel, type ApiError, DataDimension, MetricsService, OpenAPI, Widget,
    type OutbreakMetricInfo, type OutbreakMetricsRow,
} from '@dhis2-chap/ui';
import {
    Button, Checkbox, CircularLoader, DataTable, DataTableBody, DataTableCell,
    DataTableColumnHeader, DataTableHead, DataTableRow, SingleSelect, SingleSelectOption,
} from '@dhis2/ui';
import { useAlertPolicies } from '@/hooks/useAlertPolicies';
import { Features, useIsFeatureAvailable } from '@/hooks/useIsFeatureAvailable';
import { ChapErrorNotice } from '@/components/ChapErrorNotice';
import { MetricInfoIcon } from '@/components/MetricInfoIcon/MetricInfoIcon';
import { describeAlertThreshold } from '@/components/BackendAlerts/describeAlertLevel';
import tableStyles from '@/pages/BenchmarksPage/BenchmarksPage.module.css';
import styles from './OutbreakMetricsWidget.module.css';

const HEADLINE_METRIC_IDS = ['sensitivity', 'ppv', 'specificity', 'f1'];

const formatScore = (value: number | null | undefined) => (
    value != null && Number.isFinite(value)
        ? value.toLocaleString(undefined, { maximumFractionDigits: 3 })
        : i18n.t('Not defined')
);

const MetricLabel = ({ metric }: { metric: OutbreakMetricInfo }) => (
    <span className={tableStyles.metricHeader}>
        {metric.displayName}
        <MetricInfoIcon metric={metric} />
    </span>
);

type ScoresProps = {
    row: OutbreakMetricsRow;
    levels: AlertLevel[];
    binaryMetrics: OutbreakMetricInfo[];
    categoricalMetrics: OutbreakMetricInfo[];
};

const Scores = ({ row, levels, binaryMetrics, categoricalMetrics }: ScoresProps) => (
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
        <div className={tableStyles.table}>
            <DataTable>
                <DataTableHead>
                    <DataTableRow>
                        <DataTableColumnHeader>{i18n.t('Alert level')}</DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Threshold')}</DataTableColumnHeader>
                        {binaryMetrics.map(metric => (
                            <DataTableColumnHeader key={metric.id} align="right">
                                <MetricLabel metric={metric} />
                            </DataTableColumnHeader>
                        ))}
                    </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                    {row.levels.map((level) => {
                        const policyLevel = levels.find(item => item.name === level.level);
                        return (
                            <DataTableRow key={level.level}>
                                <DataTableCell className={tableStyles.strong}>{level.level}</DataTableCell>
                                <DataTableCell className={styles.threshold}>
                                    {policyLevel ? describeAlertThreshold(policyLevel) : '—'}
                                </DataTableCell>
                                {binaryMetrics.map(metric => (
                                    <DataTableCell key={metric.id} align="right" className={tableStyles.number}>
                                        {formatScore(level.metrics[metric.id])}
                                    </DataTableCell>
                                ))}
                            </DataTableRow>
                        );
                    })}
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
        queryKey: ['outbreak-metrics', OpenAPI.BASE, evaluationId, policy?.id, byHorizon],
        queryFn: () => MetricsService.getOutbreakMetricsV1AnalyticsBacktestsBacktestIdOutbreakMetricsGet(
            evaluationId, policy!.id,
            byHorizon ? [DataDimension.HORIZON_DISTANCE] : undefined,
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
        .sort((a, b) => Number(a.id === 'categorical_accuracy') - Number(b.id === 'categorical_accuracy'));
    const setupError = catalog.error ?? policies.error;

    return (
        <Widget header={i18n.t('Outbreak detection')} noncollapsible>
            <div className={styles.content} data-test="outbreak-metrics">
                <p className={styles.intro}>
                    {i18n.t('How well a policy\'s alerts match observed outbreaks, across all splits and organisation units. Each split\'s thresholds come from the data before it.')}
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
                        <div className={tableStyles.toolbar}>
                            <div className={tableStyles.actions}>
                                <div className={styles.policySelect}>
                                    <SingleSelect
                                        dense
                                        prefix={i18n.t('Alert policy')}
                                        selected={policy?.id == null ? '' : String(policy.id)}
                                        onChange={({ selected }) => setPolicyId(selected)}
                                        dataTest="outbreak-policy"
                                    >
                                        {policies.data.map(item => <SingleSelectOption key={item.id} value={String(item.id)} label={item.name} />)}
                                    </SingleSelect>
                                </div>
                                <Checkbox
                                    dense
                                    label={i18n.t('Split by horizon')}
                                    checked={byHorizon}
                                    onChange={({ checked }) => setByHorizon(checked)}
                                    dataTest="outbreak-by-horizon"
                                />
                            </div>
                            {scores.data && (
                                <Button small onClick={() => setShowAll(!showAll)}>
                                    {showAll ? i18n.t('Show fewer metrics') : i18n.t('Show all metrics')}
                                </Button>
                            )}
                        </div>
                        {policy && (
                            scores.isFetching ? (
                                <CircularLoader small />
                            ) : scores.error ? (
                                <ChapErrorNotice error={scores.error as ApiError} title={i18n.t('Could not score outbreak detection')}>
                                    <Button small onClick={() => void scores.refetch()}>{i18n.t('Retry')}</Button>
                                </ChapErrorNotice>
                            ) : scores.data?.rows.map(row => (
                                <Scores
                                    key={row.horizonDistance ?? 'overall'}
                                    row={row}
                                    levels={policy.levels ?? []}
                                    binaryMetrics={binaryMetrics}
                                    categoricalMetrics={categoricalMetrics}
                                />
                            ))
                        )}
                    </>
                )}
            </div>
        </Widget>
    );
};
