import React from 'react';
import {
    Button,
    DataTable,
    DataTableHead,
    DataTableRow,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableFoot,
    IconAdd16,
    Pagination,
    Tooltip,
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
import { ModelSpecRead, Pill } from '@dhis2-chap/ui';
import styles from './ModelsTable.module.css';
import { ModelActionsMenu } from './ModelActionsMenu';
import { ModelsTableFilters } from './ModelsTableFilters';
import { useModelsTableFilters } from './hooks/useModelsTableFilters';
import { useNavigate } from 'react-router-dom';

const labelByPeriodType = {
    month: i18n.t('Monthly'),
    year: i18n.t('Yearly'),
    week: i18n.t('Weekly'),
    day: i18n.t('Daily'),
    any: i18n.t('Any'),
};

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
    columnHelper.accessor(row => row.covariates?.length ?? 0, {
        id: 'featuresCount',
        header: i18n.t('Covariates'),
        cell: (info) => {
            const count = info.getValue();
            const covariates = info.row.original.covariates || [];

            if (count === 0) {
                return count;
            }

            const covariateNames = covariates
                .map(cov => cov.displayName)
                .filter(Boolean)
                .join(', ');

            return (
                <div className={styles.featuresCell}>
                    <Tooltip content={covariateNames || i18n.t('No covariate names available')}>
                        {({ onMouseOver, onMouseOut, ref }) => (
                            <span
                                ref={ref}
                                className={styles.infoIcon}
                                onMouseEnter={onMouseOver}
                                onMouseLeave={onMouseOut}
                            >
                                <Pill>
                                    {count}
                                </Pill>
                            </span>
                        )}
                    </Tooltip>
                </div>
            );
        },
    }),
    columnHelper.accessor('supportedPeriodType', {
        header: i18n.t('Period'),
        enableSorting: false,
        cell: (info) => {
            const periodType = info.getValue();
            return periodType ? (labelByPeriodType[periodType as keyof typeof labelByPeriodType] || periodType) : undefined;
        },
    }),
    columnHelper.accessor(row => row.target?.displayName || row.target?.name || '', {
        id: 'target',
        header: i18n.t('Target'),
        enableSorting: false,
        cell: info => info.getValue() || undefined,
    }),
    columnHelper.accessor('archived', {
        header: i18n.t('Archived'),
        cell: info => info.getValue() ? (
            <Pill variant="destructive">{i18n.t('Archived')}</Pill>
        ) : (
            <Pill variant="info">{i18n.t('Active')}</Pill>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        header: i18n.t('Actions'),
        cell: info => (
            <ModelActionsMenu
                id={info.row.original.id}
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
    const { search } = useModelsTableFilters();
    const navigate = useNavigate();

    const table = useReactTable({
        data: models || [],
        columns,
        initialState: {
            columnFilters: [
                ...(search ? [{ id: 'name', value: search }] : []),
            ],
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
                    <ModelsTableFilters table={table} />
                </div>
                <div className={styles.rightSection}>
                    <Button
                        primary
                        icon={<IconAdd16 />}
                        small
                        onClick={() => navigate('/models/new')}
                    >
                        {i18n.t('New model')}
                    </Button>
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
