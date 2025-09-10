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
    getPaginationRowModel,
} from '@tanstack/react-table';
import { ModelSpec } from '@dhis2-chap/ui';

const columnHelper = createColumnHelper<ModelSpec>();

const columns = [
    columnHelper.accessor('name', {
        header: i18n.t('Name'),
    }),
    columnHelper.accessor('description', {
        header: i18n.t('Description'),
        cell: (info) => info.getValue() || undefined,
    }),
    columnHelper.accessor('author', {
        header: i18n.t('Author'),
        cell: (info) => info.getValue() || undefined,
    }),
    columnHelper.accessor('period', {
        header: i18n.t('Period'),
        cell: (info) => info.getValue() || undefined,
    }),
    columnHelper.display({
        id: 'featuresCount',
        header: i18n.t('Features'),
        cell: (info) => info.row.original.features?.length ?? 0,
    }),
    columnHelper.accessor('targets', {
        header: i18n.t('Target(s)'),
        cell: (info) => info.getValue() || undefined,
    }),
];

type Props = {
    models: ModelSpec[];
}

export const ModelsTable = ({ models }: Props) => {
    const table = useReactTable({
        data: models || [],
        columns,
        getRowId: (row) => row.name,
        enableRowSelection: false,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const hasVisibleRows = table.getRowModel().rows.length > 0;

    return (
        <div>
            <DataTable>
                <DataTableHead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <DataTableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <DataTableColumnHeader
                                    key={header.id}
                                    fixed
                                    top
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableHead>
                <DataTableBody>
                    {hasVisibleRows ? table.getRowModel().rows
                        .map((row) => (
                            <DataTableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <DataTableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </DataTableCell>
                                ))}
                            </DataTableRow>
                        )) : (
                        <DataTableRow>
                            <DataTableCell colSpan={String(table.getAllColumns().length)} align='center'>
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

