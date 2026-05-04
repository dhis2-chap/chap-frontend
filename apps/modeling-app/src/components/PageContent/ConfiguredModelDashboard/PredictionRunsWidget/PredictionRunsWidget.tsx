import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
} from '@dhis2/ui';
import {
    Column,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import type { PredictionInfo } from '@dhis2-chap/ui';
import { Widget } from '@dhis2-chap/ui';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import {
    getPredictionPeriodIds,
    getTrainingDataToDate,
} from '../../../../utils/predictionRunMetadata';
import { PredictionRunActionsMenu } from './PredictionRunActionsMenu';
import styles from './PredictionRunsWidget.module.css';

const EMPTY_VALUE = '—';
const columnHelper = createColumnHelper<PredictionInfo>();

const formatDate = (created?: string | null) => (
    created ? format(new Date(created), 'dd.MM.yyyy, HH:mm') : EMPTY_VALUE
);

const formatPeriodList = (periods: string[]) => periods.join(', ');

const formatPeriodSummary = (periods: string[]) => {
    if (periods.length === 0) {
        return EMPTY_VALUE;
    }

    if (periods.length === 1) {
        return periods[0];
    }

    return `${periods[0]} - ${periods[periods.length - 1]}`;
};

const getSortDirection = (column: Column<PredictionInfo>) => {
    return column.getIsSorted() || 'default';
};

const PredictionPeriodsCell = ({ prediction }: { prediction: PredictionInfo }) => {
    const predictionPeriods = getPredictionPeriodIds(prediction);
    const periodList = formatPeriodList(predictionPeriods);

    if (predictionPeriods.length === 0 && !prediction.nPeriods) {
        return EMPTY_VALUE;
    }

    return (
        <span title={periodList || undefined}>
            {formatPeriodSummary(predictionPeriods)}
        </span>
    );
};

type Props = {
    configuredId?: string;
    error?: unknown;
    hasValidConfiguredId: boolean;
    isLoading: boolean;
    predictions: PredictionInfo[];
};

export const PredictionRunsWidget = ({
    configuredId,
    error,
    hasValidConfiguredId,
    isLoading,
    predictions,
}: Props) => {
    const hasError = !!error;
    const hasRuns = predictions.length > 0;
    const [sorting, setSorting] = useState<SortingState>([{ id: 'created', desc: true }]);
    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: () => i18n.t('Run name'),
            cell: info => (
                <Link to={`/predictions/${configuredId}/runs/${info.row.original.id}`}>
                    {info.getValue() || i18n.t('Unnamed prediction')}
                </Link>
            ),
        }),
        columnHelper.accessor('created', {
            header: () => i18n.t('Created'),
            cell: info => formatDate(info.getValue()),
        }),
        columnHelper.accessor(row => formatPeriodList(getPredictionPeriodIds(row)) || String(row.nPeriods), {
            id: 'predictionPeriods',
            header: () => i18n.t('Prediction periods'),
            enableSorting: false,
            cell: info => (
                <PredictionPeriodsCell prediction={info.row.original} />
            ),
        }),
        columnHelper.accessor(row => getTrainingDataToDate(row) || '', {
            id: 'trainingDataToDate',
            header: () => i18n.t('Training data cutoff'),
            cell: info => info.getValue() || EMPTY_VALUE,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => i18n.t('Actions'),
            enableSorting: false,
            cell: info => (
                <PredictionRunActionsMenu
                    configuredId={configuredId}
                    predictionId={info.row.original.id}
                />
            ),
        }),
    ], [configuredId]);
    const table = useReactTable({
        data: predictions,
        columns,
        state: {
            sorting,
        },
        getRowId: row => String(row.id),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
    });

    return (
        <Widget
            header={i18n.t('Prediction runs')}
            noncollapsible
        >
            <div className={styles.content}>
                {isLoading && (
                    <div className={styles.loadingState}>
                        <CircularLoader small />
                    </div>
                )}
                {hasError && !isLoading && (
                    <div className={styles.errorState}>
                        {i18n.t('Error loading prediction runs')}
                    </div>
                )}
                {!isLoading && !hasError && !hasValidConfiguredId && (
                    <div className={styles.emptyState}>
                        {i18n.t('Invalid prediction setup')}
                    </div>
                )}
                {!isLoading && !hasError && hasValidConfiguredId && !hasRuns && (
                    <div className={styles.emptyState}>
                        {i18n.t('No prediction runs yet. Run a prediction manually or add a schedule to start producing runs.')}
                    </div>
                )}
                {!isLoading && !hasError && hasRuns && (
                    <DataTable>
                        <DataTableHead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <DataTableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <DataTableColumnHeader
                                            key={header.id}
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
                            {table.getRowModel().rows.map(row => (
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
                            ))}
                        </DataTableBody>
                    </DataTable>
                )}
            </div>
        </Widget>
    );
};
