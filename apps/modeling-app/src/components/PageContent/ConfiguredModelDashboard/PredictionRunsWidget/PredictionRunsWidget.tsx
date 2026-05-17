import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    Tooltip,
} from '@dhis2/ui';
import { IconClockHistory16 } from '@dhis2/ui-icons';
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
import { StatusIndicator, Widget } from '@dhis2-chap/ui';
import { Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useMemo, useState } from 'react';
import {
    formatPeriodId,
    getPredictionPeriodIds,
    getTrainingDataToDate,
} from '../../../../utils/predictionRunMetadata';
import { PredictionRunActionsMenu } from './PredictionRunActionsMenu';
import styles from './PredictionRunsWidget.module.css';

const EMPTY_VALUE = '-';
const columnHelper = createColumnHelper<PredictionInfo>();

const formatDate = (created?: string | null) => (
    created ? format(new Date(created), 'dd.MM.yyyy, HH:mm') : EMPTY_VALUE
);

const formatRunCount = (count: number) => i18n.t('{{count}} run', {
    count,
    defaultValue: '{{count}} run',
    defaultValue_plural: '{{count}} runs',
});

const formatLastRun = (created?: string | null) => (
    created
        ? i18n.t('Last run {{timeAgo}} ago', {
                timeAgo: formatDistanceToNow(new Date(created)),
            })
        : i18n.t('No runs yet')
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
    hasRunningJob: boolean;
    isLoading: boolean;
    predictions: PredictionInfo[];
};

type WidgetHeaderProps = {
    hasRunningJob: boolean;
    predictions: PredictionInfo[];
};

const WidgetHeader = ({
    hasRunningJob,
    predictions,
}: WidgetHeaderProps) => {
    const latestCreated = predictions[0]?.created;
    const lastRunLabel = formatLastRun(latestCreated);

    return (
        <div className={styles.header}>
            <span className={styles.title}>{i18n.t('Completed predictions')}</span>
            <div className={styles.meta}>
                {hasRunningJob && (
                    <StatusIndicator
                        label={i18n.t('Running job')}
                        variant="info"
                        active
                    />
                )}
                <span>{formatRunCount(predictions.length)}</span>
                <span className={styles.lastRun}>
                    <IconClockHistory16 />
                    {latestCreated
                        ? (
                                <Tooltip content={formatDate(latestCreated)}>
                                    <span className={styles.lastRunTooltip}>{lastRunLabel}</span>
                                </Tooltip>
                            )
                        : <span>{lastRunLabel}</span>}
                </span>
            </div>
        </div>
    );
};

export const PredictionRunsWidget = ({
    configuredId,
    error,
    hasValidConfiguredId,
    hasRunningJob,
    isLoading,
    predictions,
}: Props) => {
    const hasError = !!error;
    const hasRuns = predictions.length > 0;
    const [open, setOpen] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'created', desc: true }]);
    const navigate = useNavigate();
    const columns = useMemo(() => [
        columnHelper.accessor('id', {
            header: () => i18n.t('Run ID'),
            cell: info => (
                <Link to={`/predictions/${configuredId}/runs/${info.row.original.id}`}>
                    {info.getValue()}
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
            cell: info => formatPeriodId(info.getValue()) || EMPTY_VALUE,
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
            header={(
                <WidgetHeader
                    hasRunningJob={hasRunningJob}
                    predictions={predictions}
                />
            )}
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
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
                        {i18n.t('No completed predictions yet. Run a prediction to start producing predictions.')}
                    </div>
                )}
                {!isLoading && !hasError && hasRuns && (
                    <DataTable className={styles.flushTable}>
                        <DataTableHead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <DataTableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <DataTableColumnHeader
                                            key={header.id}
                                            className={styles.denseHeaderCell}
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
                            {table.getRowModel().rows.map((row) => {
                                const navigateToRun = () => navigate(
                                    `/predictions/${configuredId}/runs/${row.original.id}`,
                                );
                                return (
                                    <DataTableRow
                                        key={row.id}
                                        className={styles.clickableRow}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const isActionsCell = cell.column.id === 'actions';
                                            return (
                                                <DataTableCell
                                                    key={cell.id}
                                                    className={styles.denseCell}
                                                    onClick={isActionsCell ? undefined : navigateToRun}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </DataTableCell>
                                            );
                                        })}
                                    </DataTableRow>
                                );
                            })}
                        </DataTableBody>
                    </DataTable>
                )}
            </div>
        </Widget>
    );
};
