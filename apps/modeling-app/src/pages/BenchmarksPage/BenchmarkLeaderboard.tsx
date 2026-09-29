import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox } from '@dhis2/ui';
import { BacktestRead, BacktestSpecificationRead, VisualizationsService } from '@dhis2-chap/ui';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import { benchmarkCsv, getBestRunIds, getMetricIds } from './benchmarkUtils';
import { prettifyMetricId } from '../../components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import styles from './BenchmarksPage.module.css';

const columnHelper = createColumnHelper<BacktestRead>();

export const BenchmarkLeaderboard = ({ specification }: { specification: BacktestSpecificationRead }) => {
    const { backtests } = specification;
    const evaluationId = backtests[0]?.id;
    const catalog = useQuery({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => VisualizationsService.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId!),
        enabled: evaluationId != null,
        staleTime: 5 * 60 * 1000,
    });
    const columns = useMemo(() => [
        columnHelper.accessor(run => run.configuredModel?.name ?? run.modelId, {
            id: 'model',
            header: i18n.t('Model'),
        }),
        columnHelper.accessor(run => run.modelTemplateVersion ?? undefined, {
            id: 'version',
            header: i18n.t('Version'),
            cell: info => info.getValue() ?? '—',
            sortUndefined: 'last',
        }),
        columnHelper.accessor(run => run.created ?? undefined, {
            id: 'created',
            header: i18n.t('Created'),
            cell: info => info.getValue() ? format(new Date(info.getValue()!), 'dd.MM.yyyy, HH:mm') : '—',
            sortUndefined: 'last',
        }),
        ...getMetricIds(backtests).map((metricId) => {
            const metric = catalog.data?.find(item => item.id === metricId);
            const bestRunIds = getBestRunIds(backtests, metric);
            const label = metric?.displayName || prettifyMetricId(metricId);
            return columnHelper.accessor(run => Number.isFinite(run.aggregateMetrics[metricId]) ? run.aggregateMetrics[metricId] : undefined, {
                id: `metric:${metricId}`,
                header: () => <span title={metric?.description}>{metric?.unit ? `${label} (${metric.unit})` : label}</span>,
                sortUndefined: 'last',
                sortDescFirst: metric?.optimizationDirection === 'maximize',
                cell: (info) => {
                    const value = info.getValue();
                    if (value === undefined) return '—';
                    const best = bestRunIds.has(info.row.original.id);
                    return (
                        <span className={best ? styles.best : undefined} title={best ? i18n.t('Best score') : undefined}>
                            {value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
                        </span>
                    );
                },
            });
        }),
        columnHelper.display({
            id: 'evaluation',
            header: i18n.t('Evaluation'),
            cell: ({ row }) => (
                <Link to={`/evaluate/${row.original.id}`}>
                    {i18n.t('View evaluation')}
                    {' '}
                    #
                    {row.original.id}
                </Link>
            ),
        }),
    ], [backtests, catalog.data]);
    const table = useReactTable({
        data: backtests,
        columns,
        enableSortingRemoval: false,
        initialState: { sorting: [{ id: 'created', desc: true }] },
        getRowId: run => String(run.id),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <>
            <div className={styles.toolbar}>
                <span>{i18n.t('Aggregate scores across all splits and organisation units. Best scores are highlighted, including ties.')}</span>
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
                                        <DataTableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</DataTableCell>
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
