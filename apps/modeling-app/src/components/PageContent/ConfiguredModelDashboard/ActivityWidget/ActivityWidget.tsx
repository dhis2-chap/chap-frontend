import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    MenuItem,
    SingleSelect,
} from '@dhis2/ui';
import { Widget } from '@dhis2-chap/ui';
import type { JobDescription } from '@dhis2-chap/ui';
import { Link } from 'react-router-dom';
import {
    Column,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { JOB_STATUSES } from '../../../../hooks/useJobs';
import { JobActionsMenu } from '../../../JobsTable/JobActionsMenu/JobActionsMenu';
import { StatusCell } from '../../../JobsTable/TableCells/StatusCell';
import styles from './ActivityWidget.module.css';

const EMPTY_VALUE = '—';
const MAX_VISIBLE_ROWS = 5;
const columnHelper = createColumnHelper<JobDescription>();

const formatDateTime = (value?: string | null) => (
    value ? format(new Date(value), 'dd.MM.yyyy, HH:mm') : EMPTY_VALUE
);

const formatJobDuration = (job: JobDescription) => {
    const start = job.start_time;
    const end = job.end_time;

    if (!start || !end) {
        return EMPTY_VALUE;
    }

    const duration = intervalToDuration({
        start: new Date(start),
        end: new Date(end),
    });

    return formatDuration(duration, {
        format: ['hours', 'minutes', 'seconds'],
        delimiter: ' ',
    }) || EMPTY_VALUE;
};

const getSortDirection = (column: Column<JobDescription>) => {
    return column.getIsSorted() || 'default';
};

type Props = {
    error?: unknown;
    hasValidConfiguredId: boolean;
    isLoading: boolean;
    jobs: JobDescription[];
};

export const ActivityWidget = ({
    error,
    hasValidConfiguredId,
    isLoading,
    jobs,
}: Props) => {
    const [open, setOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [sorting, setSorting] = useState<SortingState>([{ id: 'start_time', desc: true }]);
    const hasError = !!error;
    const columnFilters = useMemo(
        () => statusFilter ? [{ id: 'status', value: statusFilter }] : [],
        [statusFilter],
    );
    const jobsPageTo = statusFilter
        ? `/jobs?status=${encodeURIComponent(statusFilter)}`
        : '/jobs';

    const columns = useMemo(() => [
        columnHelper.accessor('status', {
            header: () => i18n.t('Status'),
            filterFn: 'equals',
            enableSorting: false,
            cell: info => (
                <StatusCell status={info.getValue()} />
            ),
        }),
        columnHelper.accessor('name', {
            header: () => i18n.t('Name'),
        }),
        columnHelper.accessor('start_time', {
            header: () => i18n.t('Started'),
            cell: info => formatDateTime(info.getValue()),
        }),
        columnHelper.accessor('end_time', {
            header: () => i18n.t('Finished'),
            cell: info => formatDateTime(info.getValue()),
        }),
        columnHelper.display({
            id: 'duration',
            header: () => i18n.t('Duration'),
            cell: info => formatJobDuration(info.row.original),
        }),
        columnHelper.display({
            id: 'actions',
            header: () => i18n.t('Actions'),
            enableSorting: false,
            cell: info => (
                <JobActionsMenu
                    jobId={info.row.original.id}
                    result={info.row.original.result}
                    status={info.row.original.status}
                    type={info.row.original.type}
                    showGoToResult={false}
                    allowDeleteSuccess={false}
                />
            ),
        }),
    ], []);

    const table = useReactTable({
        data: jobs,
        columns,
        state: {
            sorting,
            columnFilters,
            pagination: {
                pageIndex: 0,
                pageSize: MAX_VISIBLE_ROWS,
            },
        },
        getRowId: row => row.id,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
    });
    const hasVisibleRows = table.getRowModel().rows.length > 0;

    return (
        <Widget
            header={i18n.t('Recent activity')}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        >
            <div className={styles.content}>
                {isLoading && (
                    <div className={styles.loadingState}>
                        <CircularLoader small />
                    </div>
                )}
                {hasError && !isLoading && (
                    <div className={styles.errorState}>
                        {i18n.t('Error loading jobs')}
                    </div>
                )}
                {!isLoading && !hasError && !hasValidConfiguredId && (
                    <div className={styles.emptyState}>
                        {i18n.t('Invalid prediction setup')}
                    </div>
                )}
                {!isLoading && !hasError && hasValidConfiguredId && jobs.length === 0 && (
                    <div className={styles.emptyState}>
                        {i18n.t('No activity yet. Run a prediction to see job status and logs here.')}
                    </div>
                )}
                {!isLoading && !hasError && hasValidConfiguredId && jobs.length > 0 && (
                    <>
                        <div className={styles.filterBar}>
                            <div className={styles.statusFilter}>
                                <SingleSelect
                                    dense
                                    clearable
                                    clearText={i18n.t('Clear')}
                                    selected={statusFilter}
                                    placeholder={i18n.t('All statuses')}
                                    onChange={event => setStatusFilter(event.selected)}
                                >
                                    <MenuItem
                                        label={i18n.t('Pending')}
                                        value={JOB_STATUSES.PENDING}
                                    />
                                    <MenuItem
                                        label={i18n.t('Running')}
                                        value={JOB_STATUSES.STARTED}
                                    />
                                    <MenuItem
                                        label={i18n.t('Success')}
                                        value={JOB_STATUSES.SUCCESS}
                                    />
                                    <MenuItem
                                        label={i18n.t('Failed')}
                                        value={JOB_STATUSES.FAILED}
                                    />
                                    <MenuItem
                                        label={i18n.t('Cancelled')}
                                        value={JOB_STATUSES.REVOKED}
                                    />
                                </SingleSelect>
                            </div>
                            <Link className={styles.viewAllLink} to={jobsPageTo}>
                                {i18n.t('View all activity')}
                            </Link>
                        </div>
                        <DataTable>
                            <DataTableHead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <DataTableRow key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <DataTableColumnHeader
                                                key={header.id}
                                                {...(header.column.getCanSort() ? {
                                                    sortDirection: getSortDirection(header.column),
                                                    sortIconTitle: i18n.t('Sort by {{column}}', { column: header.column.id }),
                                                    onSortIconClick: () => header.column.toggleSorting(),
                                                } : {})}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                            </DataTableColumnHeader>
                                        ))}
                                    </DataTableRow>
                                ))}
                            </DataTableHead>
                            <DataTableBody>
                                {hasVisibleRows ? table.getRowModel().rows.map(row => (
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
                                )) : (
                                    <DataTableRow>
                                        <DataTableCell colSpan={String(table.getAllColumns().length)} align="center">
                                            {i18n.t('No activity matches the selected status')}
                                        </DataTableCell>
                                    </DataTableRow>
                                )}
                            </DataTableBody>
                        </DataTable>
                    </>
                )}
            </div>
        </Widget>
    );
};
