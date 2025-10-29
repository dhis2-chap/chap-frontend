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
    Button,
    IconAdd16,
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
import { PredictionInfo, ModelSpecRead } from '@dhis2-chap/ui';
import styles from './PredictionsTable.module.css';
import { PredictionsTableFilters } from './PredictionsTableFilters';
import { RunningJobsIndicator } from '../RunningJobsIndicator';
import { JOB_TYPES } from '../../hooks/useJobs';
import { PredictionActionsMenu } from './PredictionActionsMenu';
import { Link } from 'react-router-dom';
import { usePredictionsTableFilters } from './hooks/usePredictionsTableFilters';

const columnHelper = createColumnHelper<PredictionInfo>();

const columns = [
    columnHelper.accessor('id', {
        header: () => i18n.t('ID'),
        filterFn: 'equals',
    }),
    columnHelper.accessor('name', {
        header: () => i18n.t('Name'),
        filterFn: 'includesString',
        cell: info => (
            <Link to={`/predictions/${info.row.original.id}`}>
                {info.getValue()}
            </Link>
        ),
    }),
    columnHelper.accessor('created', {
        header: () => i18n.t('Created'),
        cell: info => info.getValue() ? new Date(info.getValue()!).toLocaleString() : undefined,
    }),
    columnHelper.accessor('modelId', {
        header: () => i18n.t('Model'),
        filterFn: 'equals',
        cell: (info) => {
            const modelId = info.getValue();
            const models = (info.table.options.meta as { models: ModelSpecRead[] })?.models;
            const model = models?.find((model: ModelSpecRead) => model.name === modelId);
            return model?.displayName || modelId;
        },
    }),
    columnHelper.accessor('nPeriods', {
        header: () => i18n.t('Periods'),
        cell: info => info.getValue(),
    }),
    columnHelper.display({
        id: 'actions',
        header: i18n.t('Actions'),
        cell: info => (
            <PredictionActionsMenu
                id={info.row.original.id}
                name={info.row.original.name}
            />
        ),
    }),
];

const getSortDirection = (column: Column<PredictionInfo>) => {
    return column.getIsSorted() || 'default';
};

type Props = {
    predictions: PredictionInfo[];
    models: ModelSpecRead[];
};

export const PredictionsTable = ({ predictions, models }: Props) => {
    const { search } = usePredictionsTableFilters();

    const table = useReactTable({
        data: predictions || [],
        columns,
        state: {
            sorting: [{ id: 'created', desc: true }],
            columnFilters: [
                ...(search ? [{ id: 'name', value: search }] : []),
            ],
        },
        meta: {
            models,
        },
        getRowId: row => row.id.toString(),
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
                    <PredictionsTableFilters />
                </div>
                <div className={styles.rightSection}>
                    <RunningJobsIndicator jobType={JOB_TYPES.MAKE_PREDICTION} />
                    <Link to="/predictions/new">
                        <Button
                            primary
                            icon={<IconAdd16 />}
                            small
                            onClick={() => { }}
                        >
                            {i18n.t('New prediction')}
                        </Button>
                    </Link>
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
                                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                                {i18n.t('No predictions available') as string}
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
