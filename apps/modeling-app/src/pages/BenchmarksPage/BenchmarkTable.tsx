import { ReactNode, useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, IconInfo16, NoticeBox, Tooltip } from '@dhis2/ui';
import { BacktestRead, BacktestSpecificationRead, VisualizationsService } from '@dhis2-chap/ui';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { TableActionButton } from '../../components/TableActionButton';
import { useModels } from '../../hooks/useModels';
import { benchmarkCsv, getBestRunIds, getMetricIds, metricSortKey } from './benchmarkUtils';
import { prettifyMetricId } from '../../components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import styles from './BenchmarksPage.module.css';

const columnHelper = createColumnHelper<BacktestRead>();

type Props = {
    specification: BacktestSpecificationRead;
    actions?: ReactNode;
    children?: ReactNode;
};

const isMetricColumn = (id: string) => id.startsWith('metric:');

const ViewEvaluationButton = ({ evaluationId }: { evaluationId: number }) => {
    const navigate = useNavigate();
    return (
        <TableActionButton dataTest={`view-evaluation-${evaluationId}`} onClick={() => navigate(`/evaluate/${evaluationId}`)}>
            {i18n.t('View evaluation')}
        </TableActionButton>
    );
};

export const BenchmarkTable = ({ specification, actions, children }: Props) => {
    const { backtests } = specification;
    const evaluationId = backtests[0]?.id;
    const catalog = useQuery({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId!),
        enabled: evaluationId != null,
        staleTime: 5 * 60 * 1000,
    });
    // Runs keep pointing at archived models, so resolve names against all of them.
    const { models } = useModels({ includeArchived: true });
    const columns = useMemo(() => [
        columnHelper.accessor(run => models?.find(model => model.id === run.configuredModel?.id)?.displayName || run.configuredModel?.name || run.modelId, {
            id: 'model',
            header: i18n.t('Model'),
            cell: info => <span className={styles.strong}>{info.getValue()}</span>,
        }),
        ...getMetricIds(backtests).map((metricId) => {
            const metric = catalog.data?.find(item => item.id === metricId);
            const bestRunIds = getBestRunIds(backtests, metric);
            const label = metric?.displayName || prettifyMetricId(metricId);
            return columnHelper.accessor(run => Number.isFinite(run.aggregateMetrics[metricId]) ? run.aggregateMetrics[metricId] : undefined, {
                id: `metric:${metricId}`,
                header: () => (
                    <span className={styles.metricHeader}>
                        {metric?.unit ? `${label} (${metric.unit})` : label}
                        {metric?.description?.trim() && (
                            <Tooltip content={metric.description}>
                                <span className={styles.infoIcon}>
                                    <IconInfo16 color="var(--colors-grey600)" />
                                </span>
                            </Tooltip>
                        )}
                    </span>
                ),
                sortUndefined: 'last',
                sortingFn: (a, b, id) => metricSortKey(a.getValue<number>(id), metric) - metricSortKey(b.getValue<number>(id), metric),
                cell: (info) => {
                    const value = info.getValue();
                    if (value === undefined) return '—';
                    const best = bestRunIds.has(info.row.original.id);
                    return (
                        <span className={best ? styles.best : undefined} title={best ? i18n.t('Best score among these runs') : undefined}>
                            {value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
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
    ], [backtests, catalog.data, models]);
    // Newest runs first until the user sorts by a column.
    const runs = useMemo(() => [...backtests].sort((a, b) => (b.created ?? '').localeCompare(a.created ?? '')), [backtests]);
    const table = useReactTable({
        data: runs,
        columns,
        enableSortingRemoval: false,
        getRowId: run => String(run.id),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <>
            <div className={styles.toolbar}>
                <div>
                    <h2 className={styles.cardTitle}>{i18n.t('Benchmarks')}</h2>
                    <p className={styles.caption}>
                        {i18n.t('Aggregate scores across all splits and organisation units. The best score in each column is highlighted, including ties. Best only means best among these runs, not necessarily a good score.')}
                    </p>
                </div>
                <div className={styles.actions}>
                    {actions}
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
                                            align={isMetricColumn(header.column.id) ? 'right' : undefined}
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
                                            align={isMetricColumn(cell.column.id) ? 'right' : undefined}
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
