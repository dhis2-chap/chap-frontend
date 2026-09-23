import i18n from '@dhis2/d2-i18n';
import {
    Button,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableFoot,
    DataTableHead,
    DataTableRow,
    IconAdd16,
    Pagination,
} from '@dhis2/ui';
import {
    Column,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { DataSetInfo, getPeriodNameFromId, Tag } from '@dhis2-chap/ui';
import { useTablePaginationParams } from '../../../../hooks/useTablePaginationParams';
import { DatasetOriginFilter, matchesOrigin, useDatasetOriginFilter } from '../../../DatasetOriginFilter';
import styles from './DatasetsTable.module.css';

const columnHelper = createColumnHelper<DataSetInfo>();

const columns = [
    columnHelper.accessor('name', {
        header: i18n.t('Name'),
    }),
    columnHelper.accessor('created', {
        header: i18n.t('Created'),
        cell: (info) => {
            const created = info.getValue();
            return created ? format(new Date(created), 'dd.MM.yyyy') : '-';
        },
    }),
    columnHelper.accessor('firstPeriod', {
        header: i18n.t('Period'),
        enableSorting: false,
        cell: ({ row: { original: dataset } }) => (
            dataset.firstPeriod && dataset.lastPeriod
                ? `${getPeriodNameFromId(dataset.firstPeriod, 'short')} – ${getPeriodNameFromId(dataset.lastPeriod, 'short')}`
                : '-'
        ),
    }),
    columnHelper.accessor(row => row.orgUnits?.length ?? 0, {
        id: 'locations',
        header: i18n.t('Locations'),
    }),
    columnHelper.accessor('covariates', {
        header: i18n.t('Covariates'),
        enableSorting: false,
        cell: info => (
            <div className={styles.covariates}>
                {info.getValue()?.map(covariate => <Tag key={covariate}>{covariate}</Tag>)}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        header: i18n.t('Actions'),
        cell: info => <EvaluateButton datasetId={info.row.original.id} />,
    }),
];

const EvaluateButton = ({ datasetId }: { datasetId?: number | null }) => {
    const navigate = useNavigate();
    if (datasetId == null) return null;
    return (
        <Button small secondary onClick={() => navigate(`/evaluate/from-dataset?datasetId=${datasetId}`)}>
            {i18n.t('Evaluate')}
        </Button>
    );
};

const getSortDirection = (column: Column<DataSetInfo>) => column.getIsSorted() || 'default';

type Props = {
    datasets: DataSetInfo[];
};

export const DatasetsTable = ({ datasets }: Props) => {
    const navigate = useNavigate();
    const { pageIndex, pageSize, setPageIndex, setPageSize } = useTablePaginationParams();
    const { origin } = useDatasetOriginFilter();

    const table = useReactTable({
        data: datasets.filter(dataset => matchesOrigin(dataset, origin)),
        columns,
        state: { pagination: { pageIndex, pageSize } },
        initialState: { sorting: [{ id: 'created', desc: true }] },
        getRowId: row => String(row.id),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const rows = table.getRowModel().rows;

    return (
        <div>
            <div className={styles.buttonContainer}>
                <div className={styles.leftSection}>
                    <DatasetOriginFilter datasets={datasets} />
                </div>
                <Button primary small icon={<IconAdd16 />} onClick={() => navigate('/datasets/new')}>
                    {i18n.t('New dataset')}
                </Button>
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
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableHead>
                <DataTableBody>
                    {rows.length > 0 ? rows.map(row => (
                        <DataTableRow key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <DataTableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                    )) : (
                        <DataTableRow>
                            <DataTableCell colSpan={String(columns.length)} align="center">
                                {i18n.t('No datasets yet. Create one to reuse the same data across evaluations.')}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>
                <DataTableFoot>
                    <DataTableRow>
                        <DataTableCell colSpan={String(columns.length)}>
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
