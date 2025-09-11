import React, { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    Button,
    ButtonStrip,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    DataTableFoot,
    Pagination,
    SingleSelectField,
    SingleSelectOption,
    NoticeBox,
} from '@dhis2/ui';
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
import { ImportSummaryCorrected } from '../hooks/useCreateNewBacktest';
import styles from './SummaryModal.module.css';
import { useQueryClient } from '@tanstack/react-query';
import { OrgUnitResponse } from '../utils/queryUtils';

interface SummaryModalProps {
    importSummary: ImportSummaryCorrected;
    periodType: string;
    onClose: () => void;
}

interface RejectedItem {
    reason: string;
    featureName: string;
    orgUnit: string;
    period: string[];
}

const columnHelper = createColumnHelper<RejectedItem>();

const getSortDirection = (column: Column<RejectedItem>) => {
    return column.getIsSorted() || 'default';
};

export const SummaryModal: React.FC<SummaryModalProps> = ({
    importSummary,
    onClose,
}) => {
    const queryClient = useQueryClient();
    const hasRejectedItems = importSummary.rejected.length > 0;
    const hasImportedItems = importSummary.importedCount > 0;

    const orgUnitNames: Map<string, string> = useMemo(() => {
        const defaultMap = new Map();

        if (!importSummary.hash) {
            return defaultMap;
        }

        const cachedOrgUnitResponse = queryClient.getQueryData(['new-backtest-data', 'org-units', importSummary.hash]) as OrgUnitResponse | undefined;

        if (!cachedOrgUnitResponse) {
            return defaultMap;
        }
        return new Map(cachedOrgUnitResponse.geojson.organisationUnits.map(ou => [ou.id, ou.displayName]));
    }, [queryClient, importSummary.hash]);

    const columns = [
        columnHelper.accessor('reason', {
            header: i18n.t('Reason'),
            filterFn: 'includesString',
            enableSorting: false,
        }),
        columnHelper.accessor('featureName', {
            header: i18n.t('Feature'),
            filterFn: 'equals',
        }),
        columnHelper.accessor('orgUnit', {
            header: i18n.t('Org unit'),
            filterFn: 'equals',
            sortingFn: (rowA, rowB) => {
                const orgUnitA = orgUnitNames.get(rowA.original.orgUnit);
                const orgUnitB = orgUnitNames.get(rowB.original.orgUnit);
                if (orgUnitA && orgUnitB) {
                    return orgUnitA.localeCompare(orgUnitB);
                }
                return 0;
            },
            cell: info => orgUnitNames.get(info.getValue()) || info.getValue(),
        }),
        columnHelper.accessor('period', {
            header: i18n.t('Period'),
            cell: info => info.getValue().join(', '),
            enableSorting: false,
        }),
    ];

    const table = useReactTable({
        data: importSummary.rejected || [],
        columns,
        initialState: {
            sorting: [{ id: 'reason', desc: false }],
        },
        getRowId: (row, index) => `${row.featureName}-${row.orgUnit}-${index}`,
        enableRowSelection: false,
        getSortedRowModel: getSortedRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Get unique values for filters
    const uniqueFeatureNames = Array.from(new Set(importSummary.rejected.map(item => item.featureName))).sort();
    const uniqueOrgUnits = Array.from(new Set(importSummary.rejected.map(item => item.orgUnit))).sort();

    const featureNameFilter = table.getColumn('featureName')?.getFilterValue() as string;
    const orgUnitFilter = table.getColumn('orgUnit')?.getFilterValue() as string;

    const hasVisibleRows = table.getRowModel().rows.length > 0;

    return (
        <Modal large onClose={onClose}>
            <ModalTitle>{i18n.t('Import Summary')}</ModalTitle>
            <ModalContent>
                <div className={styles.modalContent}>
                    {hasImportedItems && importSummary.rejected.length === 0 ? (
                        <NoticeBox
                            title={i18n.t('Valid import')}
                            valid
                        >
                            {i18n.t('All {{count}} locations can be successfully imported', {
                                count: importSummary.importedCount,
                                defaultValue: '{{count}} location can be successfully imported',
                                defaultValue_plural: 'All {{count}} locations can be successfully imported',
                            })}
                        </NoticeBox>
                    ) : null}
                    {hasImportedItems && importSummary.rejected.length > 0 ? (
                        <NoticeBox
                            title={i18n.t('Partial import')}
                            warning
                        >
                            {i18n.t('{{count}} locations could be successfully imported, but some were rejected', {
                                count: importSummary.importedCount,
                                defaultValue: '{{count}} location could be successfully imported, but some were rejected',
                                defaultValue_plural: '{{count}} locations could be successfully imported, but some were rejected',
                            })}
                        </NoticeBox>
                    ) : null}
                    {!hasImportedItems && importSummary.rejected.length > 0 ? (
                        <NoticeBox
                            title={i18n.t('No locations imported')}
                            error
                        >
                            {i18n.t('None of the provided locations could be imported. Please check the data items and the period type.')}
                        </NoticeBox>
                    ) : null}

                    <div className={styles.summaryStats}>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>{importSummary.importedCount ?? 0}</div>
                            <div className={styles.statLabel}>{i18n.t('Valid')}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>{uniqueOrgUnits.length ?? 0}</div>
                            <div className={styles.statLabel}>{i18n.t('Rejected')}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>{(importSummary.importedCount ?? 0) + (uniqueOrgUnits.length ?? 0)}</div>
                            <div className={styles.statLabel}>{i18n.t('Total')}</div>
                        </div>
                    </div>

                    {hasRejectedItems && (
                        <div className={styles.filtersContainer}>
                            <SingleSelectField
                                label={i18n.t('Filter by Feature')}
                                selected={featureNameFilter || ''}
                                onChange={({ selected }) => {
                                    table.getColumn('featureName')?.setFilterValue(selected === '' ? undefined : selected);
                                }}
                                clearable
                                clearText={i18n.t('Clear filter')}
                            >
                                <SingleSelectOption value="" label={i18n.t('All features')} />
                                {uniqueFeatureNames.map(featureName => (
                                    <SingleSelectOption
                                        key={featureName}
                                        value={featureName}
                                        label={featureName}
                                    />
                                ))}
                            </SingleSelectField>

                            <SingleSelectField
                                label={i18n.t('Filter by Org Unit')}
                                selected={orgUnitFilter || ''}
                                onChange={({ selected }) => {
                                    table.getColumn('orgUnit')?.setFilterValue(selected === '' ? undefined : selected);
                                }}
                                clearable
                                clearText={i18n.t('Clear filter')}
                            >
                                <SingleSelectOption value="" label={i18n.t('All org units')} />
                                {uniqueOrgUnits.map(orgUnit => (
                                    <SingleSelectOption
                                        key={orgUnit}
                                        value={orgUnit}
                                        label={orgUnitNames.get(orgUnit) || orgUnit}
                                    />
                                ))}
                            </SingleSelectField>
                        </div>
                    )}

                    {hasRejectedItems ? (
                        <>
                            <div className={styles.tableContainer}>
                                <DataTable>
                                    <DataTableHead>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <DataTableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
                                                    <DataTableColumnHeader
                                                        key={header.id}
                                                        fixed
                                                        // @ts-expect-error - top is expected to be a string in the code, but types is set to boolean | undefined
                                                        top="0"
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
                                                    {i18n.t('No rejected items match the current filters')}
                                                </DataTableCell>
                                            </DataTableRow>
                                        )}
                                    </DataTableBody>

                                    {table.getPageCount() > 1 && (
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
                                    )}
                                </DataTable>
                            </div>
                        </>
                    ) : (
                        !hasImportedItems && (
                            <div className={styles.emptyState}>
                                {i18n.t('No items to display')}
                            </div>
                        )
                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose}>
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
