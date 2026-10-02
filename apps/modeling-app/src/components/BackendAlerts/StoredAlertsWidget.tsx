import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Button,
    CircularLoader,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    NoticeBox,
    Pagination,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Widget, type AlertRead } from '@dhis2-chap/ui';
import { loadPredictionAlerts } from '@/utils/predictionAlerts';
import { getChapErrorMessage } from '@/utils/chapErrors';
import { formatPeriodId } from '@/utils/predictionRunMetadata';
import styles from './BackendAlerts.module.css';

const column = createColumnHelper<AlertRead>();
const EMPTY_ALERTS: AlertRead[] = [];

export const StoredAlertsWidget = ({ predictionIds }: { predictionIds: number[] }) => {
    const ids = [...new Set(predictionIds)].sort((a, b) => a - b);
    const alerts = useQuery({
        queryKey: ['stored-alerts', ids],
        queryFn: () => loadPredictionAlerts(ids),
        retry: false,
    });
    const columns = useMemo(
        () => [
            column.accessor('timePeriod', {
                header: () => i18n.t('Period'),
                cell: info => formatPeriodId(info.getValue()),
            }),
            column.accessor('orgUnit', {
                header: () => i18n.t('Organisation unit'),
            }),
            column.accessor('predictionId', { header: () => i18n.t('Run ID') }),
            column.accessor('level', { header: () => i18n.t('Alert level') }),
            column.accessor('approved', {
                header: () => i18n.t('Review status'),
            }),
        ],
        [],
    );
    const table = useReactTable({
        data: alerts.data ?? EMPTY_ALERTS,
        columns,
        getRowId: row => String(row.id),
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    });
    const { pageIndex, pageSize } = table.getState().pagination;
    return (
        <Widget header={i18n.t('Recorded alerts')} noncollapsible>
            <div className={styles.content} data-test="stored-alerts">
                {alerts.isLoading && <CircularLoader small />}
                {alerts.isError && (
                    <NoticeBox error title={i18n.t('Unable to load recorded alerts')}>
                        {getChapErrorMessage(alerts.error as Error)}
                    </NoticeBox>
                )}
                {!alerts.isLoading && (
                    <Button
                        small
                        loading={alerts.isFetching}
                        disabled={alerts.isFetching}
                        onClick={() => alerts.refetch()}
                    >
                        {i18n.t('Refresh alerts')}
                    </Button>
                )}
                {!alerts.isLoading && !alerts.isError && alerts.data?.length === 0 && (
                    <p>
                        {i18n.t(
                            'No alerts have been recorded for these prediction runs. This does not mean the runs were scored or that no threshold was exceeded.',
                        )}
                    </p>
                )}
                {!alerts.isError && !!alerts.data?.length && (
                    <>
                        <div className={styles.table}>
                            <DataTable>
                                <DataTableHead>
                                    {table.getHeaderGroups().map(group => (
                                        <DataTableRow key={group.id}>
                                            {group.headers.map(header => (
                                                <DataTableColumnHeader key={header.id}>
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext(),
                                                    )}
                                                </DataTableColumnHeader>
                                            ))}
                                        </DataTableRow>
                                    ))}
                                </DataTableHead>
                                <DataTableBody>
                                    {table.getRowModel().rows.map(row => (
                                        <DataTableRow key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <DataTableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </DataTableCell>
                                            ))}
                                        </DataTableRow>
                                    ))}
                                </DataTableBody>
                            </DataTable>
                        </div>
                        <Pagination
                            page={pageIndex + 1}
                            pageSize={pageSize}
                            pageCount={table.getPageCount()}
                            total={alerts.data.length}
                            onPageChange={page => table.setPageIndex(page - 1)}
                            onPageSizeChange={size => table.setPageSize(size)}
                        />
                    </>
                )}
            </div>
        </Widget>
    );
};
