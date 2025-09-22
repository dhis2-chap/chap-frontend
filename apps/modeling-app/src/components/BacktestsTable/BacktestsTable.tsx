import React from 'react';
import {
    DataTable,
    DataTableHead,
    DataTableRow,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    Checkbox,
    Button,
    IconAdd16,
    DataTableFoot,
    Pagination,
    Tooltip,
    IconInfo16,
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
import { BackTestRead, ModelSpecRead } from '@dhis2-chap/ui';
import { Link, useNavigate } from 'react-router-dom';
import styles from './BacktestsTable.module.css';
import { BacktestActionsMenu } from './BacktestActionsMenu';
import { BacktestsTableFilters } from './BacktestsTableFilters';
import { BatchActions } from './BatchActions';
import { RunningJobsIndicator } from './RunningJobsIndicator';
import { JOB_TYPES } from '../../hooks/useJobs';

const columnHelper = createColumnHelper<BackTestRead>();

const columns = [
    columnHelper.display({
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onChange={() => table.toggleAllPageRowsSelected()}
                disabled={table.getRowModel().rows.length === 0}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onChange={() => row.toggleSelected()}
            />
        ),
    }),
    columnHelper.accessor('id', {
        header: i18n.t('ID'),
        filterFn: 'equals',
    }),
    columnHelper.accessor('name', {
        header: i18n.t('Name'),
        filterFn: 'includesString',
        cell: (info) => {
            return (
                <Link
                    to={`/evaluate/compare?baseEvaluation=${info.row.original.id}`}
                >
                    {info.getValue()}
                </Link>
            );
        },
    }),
    columnHelper.accessor('created', {
        header: i18n.t('Created'),
        cell: info => info.getValue() ? new Date(info.getValue()!).toLocaleString() : undefined,
    }),
    columnHelper.accessor('modelId', {
        header: i18n.t('Model'),
        filterFn: 'equals',
        cell: (info) => {
            const modelId = info.getValue();
            const models = (info.table.options.meta as { models: ModelSpecRead[] })?.models;
            const model = models?.find((model: ModelSpecRead) => model.name === modelId);
            return model?.displayName || modelId;
        },
    }),
    columnHelper.accessor('aggregateMetrics.crps_norm_mean', {
        header: () => (
            <div className={styles.headerWithTooltip}>
                <span>{i18n.t('CRPS (Norm)')}</span>
                <Tooltip content={i18n.t('Normalized CRPS (Continuous Ranked Probability Score) shows how close a model\'s predicted range of outcomes is to the actual result on a 0 - 1 scale. Lower values indicate better probabilistic accuracy')}>
                    <div className={styles.iconContainer}>
                        <IconInfo16 />
                    </div>
                </Tooltip>
            </div>
        ),
        cell: (info) => {
            const crps = info.getValue();
            return crps ? crps.toFixed(2) : undefined;
        },
    }),
    columnHelper.display({
        id: 'actions',
        header: i18n.t('Actions'),
        cell: info => (
            <BacktestActionsMenu
                id={info.row.original.id}
                name={info.row.original.name}
            />
        ),
    }),
];

const getSortDirection = (column: Column<BackTestRead>) => {
    return column.getIsSorted() || 'default';
};

type Props = {
    backtests: BackTestRead[];
    models: ModelSpecRead[];
};

export const BacktestsTable = ({ backtests, models }: Props) => {
    const navigate = useNavigate();
    const table = useReactTable({
        data: backtests || [],
        columns,
        initialState: {
            sorting: [{ id: 'created', desc: true }],
        },
        meta: {
            models,
        },
        getRowId: row => row.id.toString(),
        enableRowSelection: true,
        getSortedRowModel: getSortedRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const hasVisibleRows = table.getRowModel().rows.length > 0;

    return (
        <div>
            {(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) ? (
                <BatchActions table={table} />
            ) : (
                <div className={styles.buttonContainer}>
                    <div className={styles.leftSection}>
                        <BacktestsTableFilters
                            table={table}
                            models={models}
                        />
                    </div>

                    <div className={styles.rightSection}>
                        <RunningJobsIndicator jobType={JOB_TYPES.CREATE_BACKTEST_WITH_DATA} />
                        <Button
                            primary
                            icon={<IconAdd16 />}
                            small
                            onClick={() => {
                                navigate('/evaluate/new');
                            }}
                        >
                            {i18n.t('New evaluation')}
                        </Button>
                    </div>
                </div>
            )}
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
                            <DataTableRow selected={row.getIsSelected()} key={row.id}>
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
                                {i18n.t('No evaluations available')}
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
