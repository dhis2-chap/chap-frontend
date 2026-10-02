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
import type { JobDescription, PredictionInfo } from '@dhis2-chap/ui';
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
import { getChapErrorLabel } from '../../../../utils/chapErrors';
import { isActiveJob, JOB_STATUSES, JOB_TYPES } from '../../../../hooks/useJobs';
import { JobActionsMenu } from '../../../JobsTable/JobActionsMenu/JobActionsMenu';
import { ViewJobLogsModal } from '../../../JobsTable/JobActionsMenu/ViewJobLogsModal/ViewJobLogsModal';
import { StatusCell } from '../../../JobsTable/TableCells/StatusCell';

const EMPTY_VALUE = '-';

// A completed prediction, or a prediction job that has not produced one yet.
type PredictionRow = {
    id: string;
    created?: string;
    prediction?: PredictionInfo;
    job?: JobDescription;
};

const columnHelper = createColumnHelper<PredictionRow>();

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

const getSortDirection = (column: Column<PredictionRow>) => {
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
    predictionSetupId?: string;
    error?: unknown;
    hasValidPredictionSetupId: boolean;
    hasRunningJob: boolean;
    isLoading: boolean;
    jobs: JobDescription[];
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
            <span className={styles.title}>{i18n.t('Predictions')}</span>
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
    predictionSetupId,
    error,
    hasValidPredictionSetupId,
    hasRunningJob,
    isLoading,
    jobs,
    predictions,
}: Props) => {
    const hasError = !!error;

    const [open, setOpen] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'created', desc: true }]);
    const navigate = useNavigate();
    // Owned here so the modal stays open when a running row turns into a prediction row.
    const [logsJobId, setLogsJobId] = useState<string>();
    const logsJob = jobs.find(job => job.id === logsJobId);
    const rows = useMemo<PredictionRow[]>(() => {
        const predictionJobs = jobs.filter(job => job.type === JOB_TYPES.MAKE_PREDICTION);
        // A successful prediction job's result is the id of the prediction it created.
        const jobsByPredictionId = new Map(predictionJobs.map(job => [job.result, job]));
        return [
            ...predictionJobs.filter(isActiveJob).map(job => ({
                id: job.id,
                created: job.start_time ?? undefined,
                job,
            })),
            ...predictions.map(prediction => ({
                id: String(prediction.id),
                created: prediction.created,
                prediction,
                job: jobsByPredictionId.get(String(prediction.id)),
            })),
        ];
    }, [jobs, predictions]);
    const hasRuns = rows.length > 0;
    const columns = useMemo(() => [
        columnHelper.accessor(row => row.prediction?.id, {
            id: 'runId',
            header: () => i18n.t('Run ID'),
            cell: info => (info.row.original.prediction
                ? (
                        <Link to={`/predictions/${predictionSetupId}/runs/${info.row.original.prediction.id}`}>
                            {info.getValue()}
                        </Link>
                    )
                : EMPTY_VALUE),
        }),
        columnHelper.accessor('created', {
            header: () => i18n.t('Created'),
            sortUndefined: 'first',
            cell: info => formatDate(info.getValue()),
        }),
        columnHelper.accessor(row => row.job?.status ?? JOB_STATUSES.SUCCESS, {
            id: 'status',
            header: () => i18n.t('Status'),
            enableSorting: false,
            cell: info => <StatusCell status={info.getValue()} />,
        }),
        columnHelper.display({
            id: 'predictionPeriods',
            header: () => i18n.t('Prediction periods'),
            cell: info => (info.row.original.prediction
                ? <PredictionPeriodsCell prediction={info.row.original.prediction} />
                : EMPTY_VALUE),
        }),
        columnHelper.accessor(row => (row.prediction && getTrainingDataToDate(row.prediction)) || '', {
            id: 'trainingDataToDate',
            header: () => i18n.t('Training data cutoff'),
            cell: info => formatPeriodId(info.getValue()) || EMPTY_VALUE,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => i18n.t('Actions'),
            enableSorting: false,
            cell: ({ row: { original: { prediction, job } } }) => {
                if (prediction) {
                    return (
                        <PredictionRunActionsMenu
                            predictionSetupId={predictionSetupId}
                            predictionId={prediction.id}
                            onViewLogs={job && (() => setLogsJobId(job.id))}
                        />
                    );
                }
                return job && (
                    <JobActionsMenu
                        jobId={job.id}
                        status={job.status}
                        result={job.result}
                        type={job.type}
                        showGoToResult={false}
                        onViewLogs={() => setLogsJobId(job.id)}
                    />
                );
            },
        }),
    ], [predictionSetupId]);
    const table = useReactTable({
        data: rows,
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
                        {getChapErrorLabel(error, i18n.t('Error loading prediction runs'))}
                    </div>
                )}
                {!isLoading && !hasError && !hasValidPredictionSetupId && (
                    <div className={styles.emptyState}>
                        {i18n.t('Invalid prediction setup')}
                    </div>
                )}
                {!isLoading && !hasError && hasValidPredictionSetupId && !hasRuns && (
                    <div className={styles.emptyState}>
                        {i18n.t('No predictions yet. Run a prediction to start producing predictions.')}
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
                                const { prediction } = row.original;
                                const navigateToRun = prediction && (() => navigate(
                                    `/predictions/${predictionSetupId}/runs/${prediction.id}`,
                                ));
                                return (
                                    <DataTableRow
                                        key={row.id}
                                        className={navigateToRun ? styles.clickableRow : undefined}
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
            {logsJob && (
                <ViewJobLogsModal
                    jobId={logsJob.id}
                    status={logsJob.status}
                    onClose={() => setLogsJobId(undefined)}
                />
            )}
        </Widget>
    );
};
