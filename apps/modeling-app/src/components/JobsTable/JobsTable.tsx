import React from 'react';
import {
    DataTable,
    DataTableHead,
    DataTableRow,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableFoot,
    Pagination,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    Column,
} from '@tanstack/react-table';
import { intervalToDuration, formatDuration, format } from 'date-fns';
import {
    JobDescription,
} from '@dhis2-chap/ui';
import styles from './JobsTable.module.css';
import { JobsTableFilters } from './JobsTableFilters';
import { StatusCell } from './TableCells/StatusCell';
import { JobTypeCell } from './TableCells/JobTypeCell';
import { JobActionsMenu } from './JobActionsMenu/JobActionsMenu';
import { JOB_STATUSES } from '../../hooks/useJobs';
import { useJobsTableFilters } from './hooks/useJobsTableFilters';

const columnHelper = createColumnHelper<JobDescription>();

const columns = [
    columnHelper.accessor('id', {
        header: i18n.t('ID'),
        enableSorting: false,
    }),
    columnHelper.accessor('status', {
        header: i18n.t('Status'),
        filterFn: 'equals',
        enableSorting: false,
        cell: info => (
            <StatusCell
                status={info.getValue()}
            />
        ),
    }),
    columnHelper.accessor('name', {
        header: i18n.t('Name'),
        filterFn: 'includesString',
    }),
    columnHelper.accessor('type', {
        header: i18n.t('Type'),
        enableSorting: false,
        cell: info => (
            <JobTypeCell
                jobType={info.getValue()}
            />
        ),
    }),
    columnHelper.accessor('start_time', {
        header: i18n.t('Start date'),
        cell: (info) => {
            const value = info.getValue();
            return value ? format(new Date(value), 'dd-MM-yyyy hh:mm') : undefined;
        },
    }),
    columnHelper.accessor('end_time', {
        header: i18n.t('End date'),
        cell: (info) => {
            const value = info.getValue();
            return value ? format(new Date(value), 'dd-MM-yyyy hh:mm') : undefined;
        },
    }),
    columnHelper.display({
        id: 'duration',
        header: i18n.t('Duration'),
        cell: (info) => {
            const start = info.row.original.start_time;
            const end = info.row.original.end_time;
            if (!start || !end) {
                return undefined;
            }

            const duration = intervalToDuration({
                start: new Date(start),
                end: new Date(end),
            });

            return formatDuration(duration, {
                format: ['hours', 'minutes', 'seconds'],
                delimiter: ' ',
            });
        },
    }),
    columnHelper.display({
        id: 'actions',
        header: i18n.t('Actions'),
        cell: (info) => {
            const status = info.row.original.status as keyof typeof JOB_STATUSES;
            return (
                <JobActionsMenu
                    jobId={info.row.original.id}
                    result={info.row.original.result}
                    status={status}
                    type={info.row.original.type}
                />
            );
        },
    }),
];

const getSortDirection = (column: Column<JobDescription>) => {
    return column.getIsSorted() || 'default';
};

type Props = {
    jobs: JobDescription[];
};

export const JobsTable = ({ jobs }: Props) => {
    const { search, status, type } = useJobsTableFilters();

    const table = useReactTable({
        data: jobs || [],
        columns,
        state: {
            sorting: [{ id: 'start_time', desc: true }],
            columnVisibility: {
                id: false,
            },
            columnFilters: [
                ...(search ? [{ id: 'name', value: search }] : []),
                ...(status ? [{ id: 'status', value: status }] : []),
                ...(type ? [{ id: 'type', value: type }] : []),
            ],
        },
        getRowId: row => row.id.toString(),
        enableRowSelection: false,
        getSortedRowModel: getSortedRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const hasVisibleRows = table.getRowModel().rows.length > 0;

    return (
        <div>
            <div className={styles.buttonContainer}>
                <div className={styles.leftSection}>
                    <JobsTableFilters />
                </div>
            </div>
            <DataTable>
                <DataTableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <DataTableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <DataTableColumnHeader
                                    key={header.id}
                                    fixed
                                    top
                                    {...(header.column.getCanSort() ? {
                                        sortDirection: getSortDirection(header.column),
                                        sortIconTitle: i18n.t('Sort by {{column}}', { column: header.column.id }),
                                        onSortIconClick: () => header.column.toggleSorting(),
                                    } : {})}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                </DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableHead>
                <DataTableBody>
                    {hasVisibleRows ? table.getRowModel().rows
                        .map(row => (
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
                                {i18n.t('No jobs available')}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>

                <DataTableFoot>
                    <DataTableRow>
                        <DataTableCell colSpan={String(table.getAllColumns().length)}>
                            <Pagination
                                page={table.getState().pagination.pageIndex + 1}
                                pageSize={table.getState().pagination.pageSize}
                                onPageSizeChange={(pageSize: number) => table.setPageSize(pageSize)}
                                pageCount={table.getPageCount()}
                                total={table.getRowCount()}
                                isLastPage={!table.getCanNextPage()}
                                onPageChange={(page: number) => table.setPageIndex(page - 1)}
                            />
                        </DataTableCell>
                    </DataTableRow>
                </DataTableFoot>
            </DataTable>
        </div>
    );
};
