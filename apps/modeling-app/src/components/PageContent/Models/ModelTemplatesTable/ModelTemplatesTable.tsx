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
import { ModelTemplateRead, Pill } from '@dhis2-chap/ui';
import { useTablePaginationParams } from '../../../../hooks/useTablePaginationParams';
import { useTableSearchFilter } from '../../../../hooks/useTableSearchFilter';
import { TableSearchFilter } from '../../../TableSearchFilter';
import { modelStatusConfig } from '../../../../utils/modelStatusConfig';
import styles from './ModelTemplatesTable.module.css';

const labelByPeriodType: Record<string, string> = {
    month: i18n.t('Monthly'),
    year: i18n.t('Yearly'),
    week: i18n.t('Weekly'),
    day: i18n.t('Daily'),
    any: i18n.t('Any'),
};

const columnHelper = createColumnHelper<ModelTemplateRead>();

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
        enableSorting: false,
        cell: (info) => {
            const periodType = info.getValue();
            return periodType ? (labelByPeriodType[periodType] || periodType) : undefined;
        },
    }),
    columnHelper.accessor('target', {
        header: i18n.t('Target'),
        enableSorting: false,
        cell: info => info.getValue() || undefined,
    }),
    columnHelper.accessor('authorAssessedStatus', {
        header: i18n.t('Status'),
        enableSorting: false,
        cell: (info) => {
            const status = info.getValue();
            if (!status) {
                return undefined;
            }
            const config = modelStatusConfig[status];
            return (
                <Pill variant={config.pillVariant}>
                    {config.label}
                </Pill>
            );
        },
    }),
];

const getSortDirection = (column: Column<ModelTemplateRead>) => {
    return column.getIsSorted() || 'default';
};

type Props = {
    templates: ModelTemplateRead[];
};

export const ModelTemplatesTable = ({ templates }: Props) => {
    const { pageIndex, pageSize, setPageIndex, setPageSize } = useTablePaginationParams();
    const { search, setSearch } = useTableSearchFilter();

    const table = useReactTable({
        data: templates || [],
        columns,
        state: {
            columnFilters: [
                ...(search ? [{ id: 'name', value: search }] : []),
            ],
            pagination: {
                pageIndex,
                pageSize,
            },
        },
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
            <div className={styles.toolbar}>
                <TableSearchFilter
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={i18n.t('Search templates')}
                />
            </div>
            <DataTable>
                <DataTableHead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <DataTableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <DataTableColumnHeader
                                    key={header.id}
                                    fixed
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
                                {i18n.t('No model templates available')}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>

                <DataTableFoot>
                    <DataTableRow>
                        <DataTableCell colSpan={String(table.getAllColumns().length)}>
                            <Pagination
                                page={pageIndex + 1}
                                pageSize={pageSize}
                                onPageSizeChange={(newPageSize: number) => {
                                    setPageSize(newPageSize);
                                    setPageIndex(0);
                                }}
                                pageCount={table.getPageCount()}
                                total={table.getRowCount()}
                                isLastPage={!table.getCanNextPage()}
                                onPageChange={(page: number) => setPageIndex(page - 1)}
                            />
                        </DataTableCell>
                    </DataTableRow>
                </DataTableFoot>
            </DataTable>
        </div>
    );
};
