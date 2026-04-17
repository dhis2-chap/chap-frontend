import {
    Button,
    DataTable,
    DataTableHead,
    DataTableRow,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableFoot,
    Pagination,
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
import { ConfiguredModelWithDataSourceRead } from '@dhis2-chap/ui';
import { Link } from 'react-router-dom';
import styles from './ReadyToPredictTable.module.css';
import { ReadyToPredictTableFilters } from './ReadyToPredictTableFilters';
import { useReadyToPredictTableFilters } from './hooks/useReadyToPredictTableFilters';
import { useTablePaginationParams } from '../../../../hooks/useTablePaginationParams';

const columnHelper = createColumnHelper<ConfiguredModelWithDataSourceRead>();

const EMPTY_VALUE = '—';

const columns = [
    columnHelper.accessor('name', {
        header: () => i18n.t('Name'),
        filterFn: 'includesString',
        cell: info => (
            <Link to={`/predictions/new?configuredModelWithDataSourceId=${info.row.original.id}`}>
                {info.getValue()}
            </Link>
        ),
    }),
    columnHelper.display({
        id: 'labels',
        header: () => i18n.t('Labels'),
        cell: () => <span className={styles.muted}>{EMPTY_VALUE}</span>,
    }),
    columnHelper.accessor('created', {
        header: () => i18n.t('Date created'),
        cell: (info) => {
            const value = info.getValue();
            return value ? new Date(value).toLocaleDateString() : EMPTY_VALUE;
        },
    }),
    columnHelper.accessor(row => row.configuredModel?.modelTemplate?.displayName || row.configuredModel?.name || '', {
        id: 'model',
        header: () => i18n.t('Model'),
        cell: info => info.getValue() || EMPTY_VALUE,
    }),
    columnHelper.display({
        id: 'createdBy',
        header: () => i18n.t('Created by'),
        cell: () => <span className={styles.muted}>{EMPTY_VALUE}</span>,
    }),
];

const getSortDirection = (column: Column<ConfiguredModelWithDataSourceRead>) => {
    return column.getIsSorted() || 'default';
};

type Props = {
    configuredModels: ConfiguredModelWithDataSourceRead[];
};

export const ReadyToPredictTable = ({ configuredModels }: Props) => {
    const { search } = useReadyToPredictTableFilters();
    const { pageIndex, pageSize, setPageIndex, setPageSize } = useTablePaginationParams();

    const table = useReactTable({
        data: configuredModels || [],
        columns,
        state: {
            sorting: [{ id: 'created', desc: true }],
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
            <div className={styles.buttonContainer}>
                <div className={styles.leftSection}>
                    <ReadyToPredictTableFilters />
                </div>
                <div className={styles.rightSection}>
                    <Link to="/predictions/new">
                        <Button
                            primary
                            icon={<IconAdd16 />}
                            small
                            onClick={() => { }}
                        >
                            {i18n.t('New empty prediction')}
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
                                {i18n.t('No prediction configurations yet — create one from a completed evaluation.') as string}
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
