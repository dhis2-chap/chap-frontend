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
    Input,
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
import { ModelSpecRead } from '@dhis2-chap/ui';
import styles from './ModelsTable.module.css';
import { ModelActionsMenu } from './ModelActionsMenu';

const columnHelper = createColumnHelper<ModelSpecRead>();

const columns = [
    columnHelper.accessor(row => row.displayName || row.name, {
        id: 'name',
        header: i18n.t('Name'),
        filterFn: 'includesString',
        cell: info => info.getValue() || undefined,
    }),
    columnHelper.accessor('author', {
        header: i18n.t('Author'),
        cell: info => info.getValue() || undefined,
    }),
    columnHelper.accessor('supportedPeriodType', {
        header: i18n.t('Period'),
        cell: info => info.getValue() || undefined,
    }),
    columnHelper.accessor(row => row.covariates?.length ?? 0, {
        id: 'featuresCount',
        header: i18n.t('Features'),
        cell: info => info.getValue(),
    }),
    columnHelper.accessor(row => row.target?.displayName || row.target?.name || '', {
        id: 'target',
        header: i18n.t('Target'),
        enableSorting: false,
        cell: info => info.getValue() || undefined,
    }),
    columnHelper.display({
        id: 'actions',
        header: i18n.t('Actions'),
        cell: info => (
            <ModelActionsMenu
                id={info.row.original.id}
                name={info.row.original.displayName}
            />
        ),
    }),
];

const getSortDirection = (column: Column<ModelSpecRead>) => {
    return column.getIsSorted() || 'default';
};

type Props = {
    models: ModelSpecRead[];
};

export const ModelsTable = ({ models }: Props) => {
    const table = useReactTable({
        data: models || [],
        columns,
        getRowId: row => String(row.id),
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
                    <div className={styles.inputContainer}>
                        <Input
                            dense
                            placeholder={i18n.t('Search')}
                            value={(table.getColumn('name')?.getFilterValue() as string | undefined) ?? ''}
                            onChange={e => table.getColumn('name')?.setFilterValue(e.value)}
                        />
                    </div>
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
                                {i18n.t('No models available')}
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
