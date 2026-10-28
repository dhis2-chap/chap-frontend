import { ReactNode, useMemo, useState } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { Button, Checkbox, DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, MenuItem, NoticeBox, SingleSelect, Tooltip } from '@dhis2/ui';
import { LeaderboardBacktestRead, BacktestSpecificationRead, VisualizationsService } from '@dhis2-chap/ui';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { TableActionButton } from '../../components/TableActionButton';
import { useModels } from '../../hooks/useModels';
import { benchmarkCsv, getBestRunIds, getMetricIds, metricSortKey } from './benchmarkUtils';
import { formatComparison, getDefaultMetricIds, prettifyMetricId } from '../../components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { MetricInfoIcon } from '../../components/MetricInfoIcon/MetricInfoIcon';
import { getComparison, referenceLabel, referenceName, useReferenceModel } from '../../components/ModelComparisons/referenceModels';
import comparisonStyles from '../../components/ModelComparisons/ModelComparisons.module.css';
import styles from './BenchmarksPage.module.css';

/* The display name and the comparison with the selected reference are resolved into the row, because the table caches row values until the data changes. */
type BenchmarkRun = LeaderboardBacktestRead & { modelName: string; comparison?: Record<string, number | null> };

const columnHelper = createColumnHelper<BenchmarkRun>();

type Props = {
    specification: BacktestSpecificationRead;
    /* Filters and status, shown with the comparison controls. */
    options?: ReactNode;
    /* Buttons, shown on the right. */
    actions?: ReactNode;
    children?: ReactNode;
};

const isMetricColumn = (id: string) => id.startsWith('metric:');

const finite = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const ViewEvaluationButton = ({ evaluationId }: { evaluationId: number }) => {
    const navigate = useNavigate();
    return (
        <TableActionButton dataTest={`view-evaluation-${evaluationId}`} onClick={() => navigate(`/evaluate/${evaluationId}`)}>
            {i18n.t('View evaluation')}
        </TableActionButton>
    );
};

export const BenchmarkTable = ({ specification, options, actions, children }: Props) => {
    const { backtests } = specification;
    const evaluationId = backtests[0]?.id;
    // Chap Core 2.6 lists the configured metrics with the specification; older versions need the catalog.
    const catalog = useQuery({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId!),
        enabled: evaluationId != null && !specification.metrics,
        staleTime: 5 * 60 * 1000,
    });
    const metrics = specification.metrics ?? catalog.data;
    const [showAllMetrics, setShowAllMetrics] = useState(false);
    const allMetricIds = useMemo(() => getMetricIds(backtests, metrics), [backtests, metrics]);
    // Older Chap Core versions have no selected metrics, so keep showing every column there.
    const defaultMetricIds = useMemo(() => specification.metrics ? getDefaultMetricIds(allMetricIds, specification.metrics) : allMetricIds, [allMetricIds, specification.metrics]);
    const metricIds = showAllMetrics || !defaultMetricIds.length ? allMetricIds : defaultMetricIds;
    // Runs keep pointing at archived models, so resolve names against all of them.
    const { models } = useModels({ includeArchived: true });
    const [comparing, setComparing] = useState(false);
    const { references, reference: selectedReference, select } = useReferenceModel(specification);
    const reference = comparing ? selectedReference : undefined;
    // Newest runs first until the user sorts by a column. Baselines are only shown as the reference to compare with.
    const runs = useMemo<BenchmarkRun[]>(() => backtests
        .map(run => ({
            ...run,
            modelName: models?.find(model => model.id === run.configuredModel?.id)?.displayName || run.configuredModel?.name || run.modelId,
            comparison: getComparison(run, reference),
        }))
        .sort((a, b) => (b.created ?? '').localeCompare(a.created ?? '')), [backtests, models, reference]);
    const columns = useMemo(() => [
        columnHelper.accessor('modelName', {
            id: 'model',
            header: i18n.t('Model'),
            cell: info => <span className={styles.strong}>{info.getValue()}</span>,
        }),
        ...metricIds.map((metricId) => {
            const metric = metrics?.find(item => item.id === metricId);
            const bestRunIds = getBestRunIds(runs, metric);
            const label = metric?.displayName || prettifyMetricId(metricId);
            const score = (run: BenchmarkRun) => finite(run.aggregateMetrics[metricId]);
            // Comparison values are oriented so positive is better, whatever the metric's own direction.
            return columnHelper.accessor(run => reference ? finite(run.comparison?.[metricId]) : score(run), {
                id: `metric:${metricId}`,
                header: () => (
                    <span className={styles.metricHeader}>
                        {metric?.unit && !reference ? `${label} (${metric.unit})` : label}
                        <MetricInfoIcon metric={metric} comparedWith={reference && referenceName(reference)} />
                    </span>
                ),
                sortUndefined: 'last',
                sortingFn: reference
                    ? (a, b, id) => b.getValue<number>(id) - a.getValue<number>(id)
                    : (a, b, id) => metricSortKey(a.getValue<number>(id), metric) - metricSortKey(b.getValue<number>(id), metric),
                cell: (info) => {
                    const run = info.row.original;
                    const best = bestRunIds.has(run.id);
                    // A comparison model run is not compared with itself, so its row keeps the score the others are compared with.
                    if (reference && run.id === reference.backtestId) {
                        const referenceScore = score(run);
                        return referenceScore === undefined ? '—' : (
                            <span className={cx(styles.referenceScore, { [styles.best]: best })} title={i18n.t('Score of {{reference}}, which the other rows are compared with', { reference: referenceName(reference) })}>
                                {referenceScore.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
                            </span>
                        );
                    }
                    const value = info.getValue();
                    if (value === undefined) return '—';
                    return (
                        <span
                            className={cx({ [comparisonStyles.better]: reference && value > 0, [comparisonStyles.worse]: reference && value < 0, [styles.best]: best })}
                            title={best ? i18n.t('Best score among these runs') : undefined}
                        >
                            {reference ? formatComparison(value, metric) : value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
                        </span>
                    );
                },
            });
        }),
        columnHelper.accessor(run => run.modelTemplateVersion ?? undefined, {
            id: 'version',
            header: i18n.t('Version'),
            cell: info => info.getValue() ?? '—',
            sortUndefined: 'last',
        }),
        columnHelper.display({
            id: 'actions',
            header: i18n.t('Actions'),
            cell: ({ row }) => <ViewEvaluationButton evaluationId={row.original.id} />,
        }),
    ], [runs, metricIds, metrics, reference]);
    const table = useReactTable({
        data: runs,
        columns,
        enableSortingRemoval: false,
        getRowId: run => String(run.id),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const referenceSelect = selectedReference && (
        <SingleSelect dense disabled={!comparing} selected={String(selectedReference.configuredModel.id)} onChange={({ selected }) => select(selected)}>
            {references.map(item => (
                <MenuItem key={item.configuredModel.id} value={String(item.configuredModel.id)} label={referenceLabel(item)} />
            ))}
        </SingleSelect>
    );

    return (
        <>
            <div>
                <h2 className={styles.cardTitle}>{i18n.t('Benchmarks')}</h2>
                <p className={styles.caption}>
                    {reference
                        ? i18n.t('Scores compared with {{reference}}, aggregated across all splits and organisation units. Positive means better than {{reference}}, negative means worse. The best score in each column is highlighted, including ties.', { reference: referenceName(reference) })
                        : i18n.t('Aggregate scores across all splits and organisation units. The best score in each column is highlighted, including ties. Best only means best among these runs, not necessarily a good score.')}
                </p>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.actions}>
                    {references.length > 0 && (
                        <>
                            <Checkbox
                                dense
                                label={i18n.t('Compare with baseline')}
                                checked={comparing}
                                onChange={({ checked }) => setComparing(checked)}
                            />
                            {selectedReference && (comparing ? referenceSelect : (
                                <Tooltip content={i18n.t('Tick Compare with baseline to choose which model the scores are compared with.')}>
                                    {referenceSelect}
                                </Tooltip>
                            ))}
                        </>
                    )}
                    {options}
                </div>
                <div className={styles.actions}>
                    {actions}
                    {defaultMetricIds.length > 0 && defaultMetricIds.length < allMetricIds.length && (
                        <Button small onClick={() => setShowAllMetrics(!showAllMetrics)}>
                            {showAllMetrics ? i18n.t('Show default metrics') : i18n.t('Show all {{count}} metrics', { count: allMetricIds.length })}
                        </Button>
                    )}
                    <Button
                        small
                        disabled={!backtests.length}
                        onClick={() => saveAs(
                            new Blob([benchmarkCsv(specification, table.getRowModel().rows.map(row => row.original))], { type: 'text/csv;charset=utf-8' }),
                            `benchmark-${specification.id}.csv`,
                        )}
                    >
                        {i18n.t('Download CSV')}
                    </Button>
                </div>
            </div>
            {children}
            {catalog.isError && (
                <NoticeBox warning title={i18n.t('Metric descriptions unavailable')}>
                    {i18n.t('Scores are still available, but best values cannot be highlighted without metric definitions.')}
                </NoticeBox>
            )}
            {!backtests.length ? (
                <NoticeBox title={i18n.t('No model runs yet')}>
                    {i18n.t('Add models to run them against this benchmark. Completed runs will appear here.')}
                </NoticeBox>
            ) : (
                <div className={styles.table}>
                    <DataTable>
                        <DataTableHead>
                            {table.getHeaderGroups().map(group => (
                                <DataTableRow key={group.id}>
                                    {group.headers.map(header => (
                                        <DataTableColumnHeader
                                            key={header.id}
                                            className={header.column.id === 'model' ? styles.sticky : undefined}
                                            {...(header.column.getCanSort() ? {
                                                sortDirection: header.column.getIsSorted() || 'default',
                                                sortIconTitle: i18n.t('Sort by {{column}}', { column: header.column.id }),
                                                onSortIconClick: () => header.column.toggleSorting(),
                                            } : {})}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </DataTableColumnHeader>
                                    ))}
                                </DataTableRow>
                            ))}
                        </DataTableHead>
                        <DataTableBody>
                            {table.getRowModel().rows.map(row => (
                                <DataTableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <DataTableCell
                                            key={cell.id}
                                            className={isMetricColumn(cell.column.id) ? styles.number : cell.column.id === 'model' ? styles.sticky : undefined}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </DataTableCell>
                                    ))}
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </div>
            )}
        </>
    );
};
