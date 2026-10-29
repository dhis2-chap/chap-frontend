import { useState } from 'react';
import cx from 'classnames';
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
import { ReferenceModelSelector } from '@/components/ModelComparisons/ReferenceModelSelector';
import { referenceName, useReferenceModel } from '@/components/ModelComparisons/referenceModels';
import { useBacktestSpecification } from '@/pages/BenchmarksPage/useBacktestSpecification';
import comparisonStyles from '@/components/ModelComparisons/ModelComparisons.module.css';
import tableStyles from '@/pages/BenchmarksPage/BenchmarksPage.module.css';
import styles from './OutbreakMetricsWidget.module.css';

const HEADLINE_METRIC_IDS = ['sensitivity', 'ppv', 'specificity', 'f1'];

const formatScore = (value: number | null | undefined) => (
    value != null && Number.isFinite(value)
        ? value.toLocaleString(undefined, { maximumFractionDigits: 3 })
        : i18n.t('Not defined')
);

/* Every outbreak metric is higher-is-better, so the sign of the difference says which model scored better. */
const Comparison = ({ value, reference }: { value?: number | null; reference?: number | null }) => {
    if (reference == null || !Number.isFinite(reference)) return null;
    const difference = value != null && Number.isFinite(value) ? value - reference : 0;
    return (
        <span className={cx(comparisonStyles.comparison, {
            [comparisonStyles.better]: difference > 0,
            [comparisonStyles.worse]: difference < 0,
        })}
        >
            {i18n.t('vs {{reference}}', { reference: formatScore(reference) })}
        </span>
    );
};

const MetricLabel = ({ metric }: { metric: OutbreakMetricInfo }) => (
    <span className={tableStyles.metricHeader}>
        {metric.displayName}
        <MetricInfoIcon metric={metric} />
    </span>
);

type ScoresProps = {
    row: OutbreakMetricsRow;
    referenceRow?: OutbreakMetricsRow;
    levels: AlertLevel[];
    binaryMetrics: OutbreakMetricInfo[];
    categoricalMetrics: OutbreakMetricInfo[];
};

const Scores = ({ row, referenceRow, levels, binaryMetrics, categoricalMetrics }: ScoresProps) => (
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
                        const referenceLevel = referenceRow?.levels.find(item => item.level === level.level);
                        return (
                            <DataTableRow key={level.level}>
                                <DataTableCell className={tableStyles.strong}>{level.level}</DataTableCell>
                                <DataTableCell className={styles.threshold}>
                                    {policyLevel ? describeAlertThreshold(policyLevel) : '—'}
                                </DataTableCell>
                                {binaryMetrics.map(metric => (
                                    <DataTableCell key={metric.id} align="right" className={tableStyles.number}>
                                        {formatScore(level.metrics[metric.id])}
                                        <Comparison value={level.metrics[metric.id]} reference={referenceLevel?.metrics[metric.id]} />
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
                    <Comparison value={row.categorical[metric.id]} reference={referenceRow?.categorical[metric.id]} />
                </span>
            ))}
        </div>
    </div>
);

const useOutbreakScores = (backtestId: number | null | undefined, policyId: number | undefined, byHorizon: boolean, enabled: boolean) => useQuery({
    queryKey: ['outbreak-metrics', OpenAPI.BASE, backtestId, policyId, byHorizon],
    queryFn: () => MetricsService.getOutbreakMetricsV1AnalyticsBacktestsBacktestIdOutbreakMetricsGet(
        backtestId!, policyId!,
        byHorizon ? [DataDimension.HORIZON_DISTANCE] : undefined,
    ),
    enabled: enabled && backtestId != null && policyId != null,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
});

type Props = {
    evaluationId: number;
    specificationId?: number;
};

export const OutbreakMetricsWidget = ({ evaluationId, specificationId }: Props) => {
    const { isAvailable } = useIsFeatureAvailable(Features.OUTBREAK_METRICS);
    return isAvailable ? <OutbreakMetricsContent key={evaluationId} evaluationId={evaluationId} specificationId={specificationId} /> : null;
};

const OutbreakMetricsContent = ({ evaluationId, specificationId }: Props) => {
    const [open, setOpen] = useState(true);
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
    // Only baselines: comparison models are not baseline models.
    const specification = useBacktestSpecification(specificationId ?? 0, true);
    const { references, reference, select } = useReferenceModel(specification.data);
    // A reference model's own evaluation has nothing to compare with.
    const isReferenceRun = references.some(item => item.backtestId === evaluationId);
    const comparedReference = isReferenceRun ? undefined : reference;
    const scores = useOutbreakScores(evaluationId, policy?.id, byHorizon, !!catalog.data);
    const referenceScores = useOutbreakScores(comparedReference?.backtestId, policy?.id, byHorizon, !!catalog.data);

    // Development builds can report the next version before the endpoint lands.
    if (catalog.error?.status === 404) return null;

    const binaryMetrics = catalog.data?.filter(metric => (
        metric.kind === 'binary' && (showAll || HEADLINE_METRIC_IDS.includes(metric.id))
    )) ?? [];
    const categoricalMetrics = (catalog.data?.filter(metric => metric.kind === 'categorical') ?? [])
        .sort((a, b) => Number(a.id === 'categorical_accuracy') - Number(b.id === 'categorical_accuracy'));
    const setupError = catalog.error ?? policies.error;

    return (
        <Widget
            header={i18n.t('Outbreak detection')}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
        >
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
                                {specification.data && !isReferenceRun && (
                                    <div className={styles.policySelect}>
                                        <ReferenceModelSelector
                                            label={i18n.t('Compare with baseline model')}
                                            references={references}
                                            reference={reference}
                                            onSelect={select}
                                        />
                                    </div>
                                )}
                            </div>
                            {scores.data && (
                                <Button small onClick={() => setShowAll(!showAll)}>
                                    {showAll ? i18n.t('Show fewer metrics') : i18n.t('Show all metrics')}
                                </Button>
                            )}
                        </div>
                        {policy && (
                            scores.isFetching || referenceScores.isFetching ? (
                                <CircularLoader small />
                            ) : scores.error ? (
                                <ChapErrorNotice error={scores.error as ApiError} title={i18n.t('Could not score outbreak detection')}>
                                    <Button small onClick={() => void scores.refetch()}>{i18n.t('Retry')}</Button>
                                </ChapErrorNotice>
                            ) : (
                                <>
                                    {comparedReference && referenceScores.data && (
                                        <p className={styles.intro}>
                                            {i18n.t('Each score is compared with the baseline model {{reference}} under the same policy.', {
                                                reference: referenceName(comparedReference),
                                            })}
                                        </p>
                                    )}
                                    {scores.data?.rows.map(row => (
                                        <Scores
                                            key={row.horizonDistance ?? 'overall'}
                                            row={row}
                                            referenceRow={comparedReference ? referenceScores.data?.rows.find(item => item.horizonDistance === row.horizonDistance) : undefined}
                                            levels={policy.levels ?? []}
                                            binaryMetrics={binaryMetrics}
                                            categoricalMetrics={categoricalMetrics}
                                        />
                                    ))}
                                </>
                            )
                        )}
                    </>
                )}
            </div>
        </Widget>
    );
};
