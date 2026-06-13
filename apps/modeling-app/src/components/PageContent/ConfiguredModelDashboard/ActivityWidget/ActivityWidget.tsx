import { useCallback, useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    MenuItem,
    SingleSelect,
} from '@dhis2/ui';
import { Widget } from '@dhis2-chap/ui';
import type { JobDescription } from '@dhis2-chap/ui';
import { Link } from 'react-router-dom';
import {
    Column,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { JOB_STATUSES } from '../../../../hooks/useJobs';
import { DateRangePicker } from '../../../DateRangePicker';
import { JobActionsMenu } from '../../../JobsTable/JobActionsMenu/JobActionsMenu';
import { StatusCell } from '../../../JobsTable/TableCells/StatusCell';
import {
    hasDateRangeValue,
    type DateRangeValue,
} from '../../../../utils/jobDateRange';
import {
    buildJobActivityDays,
    isJobInActivityDateRange,
    type JobActivityDay,
} from './ActivityWidget.utils';
import styles from './ActivityWidget.module.css';

const EMPTY_VALUE = '-';
const MAX_VISIBLE_ROWS = 5;
const STORAGE_KEY = 'chap-modeling-app:prediction-activity-period';
const ACTIVE_COLOR = '#f59e0b';
const SUCCESS_COLOR = '#147cd7';
const FAILED_COLOR = '#d32f2f';
const columnHelper = createColumnHelper<JobDescription>();

const ACTIVITY_PERIOD_OPTIONS = [
    {
        value: '7',
        days: 7,
        label: () => i18n.t('Last 7 days'),
    },
    {
        value: '14',
        days: 14,
        label: () => i18n.t('Last 14 days'),
    },
    {
        value: '30',
        days: 30,
        label: () => i18n.t('Last 30 days'),
    },
    {
        value: '90',
        days: 90,
        label: () => i18n.t('Last 90 days'),
    },
] as const;

type ActivityPeriodValue = typeof ACTIVITY_PERIOD_OPTIONS[number]['value'];
type ActivityPeriodOption = typeof ACTIVITY_PERIOD_OPTIONS[number];
type ActivityView = 'chart' | 'table';

const DEFAULT_PERIOD: ActivityPeriodValue = '7';

const isActivityPeriodValue = (value: unknown): value is ActivityPeriodValue => (
    typeof value === 'string' &&
    ACTIVITY_PERIOD_OPTIONS.some(option => option.value === value)
);

const getActivityPeriodOption = (value: ActivityPeriodValue): ActivityPeriodOption => (
    ACTIVITY_PERIOD_OPTIONS.find(option => option.value === value)
    ?? ACTIVITY_PERIOD_OPTIONS[2]
);

const readStoredPeriod = (): ActivityPeriodValue => {
    if (typeof window === 'undefined') {
        return DEFAULT_PERIOD;
    }

    try {
        const storedPeriod = window.localStorage.getItem(STORAGE_KEY);
        return isActivityPeriodValue(storedPeriod) ? storedPeriod : DEFAULT_PERIOD;
    } catch {
        return DEFAULT_PERIOD;
    }
};

const usePersistedActivityPeriod = () => {
    const [selectedPeriod, setSelectedPeriod] = useState<ActivityPeriodValue>(readStoredPeriod);

    const updateSelectedPeriod = useCallback((period: ActivityPeriodValue) => {
        setSelectedPeriod(period);

        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(STORAGE_KEY, period);
        } catch {
            // Selection persistence is non-critical.
        }
    }, []);

    return [selectedPeriod, updateSelectedPeriod] as const;
};

const formatDateTime = (value?: string | null) => (
    value ? format(new Date(value), 'dd.MM.yyyy, HH:mm') : EMPTY_VALUE
);

const formatJobCount = (count: number) => i18n.t('{{count}} job', {
    count,
    defaultValue: '{{count}} job',
    defaultValue_plural: '{{count}} jobs',
});

const formatJobDuration = (job: JobDescription) => {
    const start = job.start_time;
    const end = job.end_time;

    if (!start || !end) {
        return EMPTY_VALUE;
    }

    const duration = intervalToDuration({
        start: new Date(start),
        end: new Date(end),
    });

    return formatDuration(duration, {
        format: ['hours', 'minutes', 'seconds'],
        delimiter: ' ',
    }) || EMPTY_VALUE;
};

const getSortDirection = (column: Column<JobDescription>) => {
    return column.getIsSorted() || 'default';
};

const getSelectedActivityRange = (
    days: JobActivityDay[],
    selection?: Highcharts.SelectDataObject,
) => {
    if (!selection || days.length === 0) {
        return undefined;
    }

    const minIndex = Math.max(0, Math.ceil(selection.min - 0.5));
    const maxIndex = Math.min(days.length - 1, Math.floor(selection.max + 0.5));
    const startIndex = Math.min(minIndex, maxIndex);
    const endIndex = Math.max(minIndex, maxIndex);

    return {
        from: days[startIndex],
        to: days[endIndex],
    };
};

const getChartOptions = (
    days: JobActivityDay[],
    onDayClick: (day: JobActivityDay) => void,
    onDaysSelect: (from: JobActivityDay, to: JobActivityDay) => void,
): Highcharts.Options => ({
    title: {
        text: '',
    },
    chart: {
        type: 'column',
        height: 404,
        backgroundColor: 'transparent',
        spacing: [10, 8, 8, 8],
        style: {
            fontFamily: 'inherit',
        },
        selectionMarkerFill: 'rgba(20, 124, 215, 0.16)',
        zooming: {
            type: 'x',
        },
        events: {
            selection: function (_event: Highcharts.SelectEventObject) {
                const selectedRange = getSelectedActivityRange(days, _event.xAxis?.[0]);

                if (selectedRange) {
                    onDaysSelect(selectedRange.from, selectedRange.to);
                }

                return false;
            },
        },
    },
    credits: {
        enabled: false,
    },
    accessibility: {
        enabled: false,
    },
    exporting: {
        enabled: false,
    },
    legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
    },
    xAxis: {
        categories: days.map(day => day.label),
        title: {
            text: i18n.t('Day'),
        },
        labels: {
            autoRotation: [-45],
            style: {
                color: '#6c7787',
                fontSize: '11px',
            },
        },
        lineColor: '#d5dde5',
        tickLength: 0,
    },
    yAxis: {
        min: 0,
        allowDecimals: false,
        title: {
            text: i18n.t('Jobs'),
        },
        gridLineColor: '#e8edf2',
        labels: {
            style: {
                color: '#6c7787',
                fontSize: '11px',
            },
        },
    },
    tooltip: {
        shared: true,
        formatter: function () {
            const pointIndex = this.points?.[0]?.point.index ?? this.point?.index ?? -1;
            const day = days[pointIndex];

            if (!day) {
                return `<span>${this.x}</span>`;
            }

            const rows = [
                `<span style="color:${ACTIVE_COLOR}">●</span> ${i18n.t('Active')}: <strong>${formatJobCount(day.activeCount)}</strong><br/>`,
                `<span style="color:${SUCCESS_COLOR}">●</span> ${i18n.t('Success')}: <strong>${formatJobCount(day.successCount)}</strong><br/>`,
                `<span style="color:${FAILED_COLOR}">●</span> ${i18n.t('Failed')}: <strong>${formatJobCount(day.failedCount)}</strong><br/>`,
            ];

            return `<span>${this.x}</span><br/>${rows.join('')}`;
        },
    },
    plotOptions: {
        series: {
            animation: false,
            cursor: 'pointer',
            point: {
                events: {
                    click: function (this: Highcharts.Point) {
                        const day = days[this.index];

                        if (day) {
                            onDayClick(day);
                        }
                    },
                },
            },
        },
        column: {
            borderRadius: 3,
            borderWidth: 0,
            groupPadding: 0.08,
            pointPadding: 0.08,
            stacking: 'normal',
        },
    },
    series: [
        {
            type: 'column',
            name: i18n.t('Active'),
            color: ACTIVE_COLOR,
            data: days.map(day => day.activeCount),
        },
        {
            type: 'column',
            name: i18n.t('Success'),
            color: SUCCESS_COLOR,
            data: days.map(day => day.successCount),
        },
        {
            type: 'column',
            name: i18n.t('Failed'),
            color: FAILED_COLOR,
            data: days.map(day => day.failedCount),
        },
        {
            type: 'scatter',
            name: 'hover-target',
            showInLegend: false,
            color: 'rgba(0, 0, 0, 0)',
            data: days.map(() => 0),
            marker: {
                enabled: true,
                fillColor: 'rgba(0, 0, 0, 0)',
                lineWidth: 0,
                radius: 6,
                states: {
                    hover: {
                        enabled: false,
                    },
                },
            },
            states: {
                inactive: {
                    opacity: 1,
                },
            },
            zIndex: 3,
        },
    ],
});

type Props = {
    error?: unknown;
    hasValidPredictionSetupId: boolean;
    isLoading: boolean;
    jobs: JobDescription[];
    predictionSetupId?: string;
};

export const ActivityWidget = ({
    error,
    hasValidPredictionSetupId,
    isLoading,
    jobs,
    predictionSetupId,
}: Props) => {
    const [open, setOpen] = useState(false);
    const [activityView, setActivityView] = useState<ActivityView>('chart');
    const [selectedPeriod, setSelectedPeriod] = usePersistedActivityPeriod();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [dateRange, setDateRange] = useState<DateRangeValue>({});
    const [sorting, setSorting] = useState<SortingState>([{ id: 'start_time', desc: true }]);
    const hasError = !!error;
    const selectedPeriodOption = getActivityPeriodOption(selectedPeriod);
    const activityDays = useMemo(
        () => buildJobActivityDays(jobs, selectedPeriodOption.days),
        [jobs, selectedPeriodOption.days],
    );
    const openActivityTableWithDateRange = useCallback((fromDate: string, toDate: string) => {
        setDateRange({
            fromDate,
            toDate,
        });
        setActivityView('table');
    }, []);
    const handleActivityDayClick = useCallback((day: JobActivityDay) => {
        openActivityTableWithDateRange(day.key, day.key);
    }, [openActivityTableWithDateRange]);
    const handleActivityDaysSelect = useCallback((from: JobActivityDay, to: JobActivityDay) => {
        openActivityTableWithDateRange(from.key, to.key);
    }, [openActivityTableWithDateRange]);
    const chartOptions = useMemo(
        () => getChartOptions(activityDays, handleActivityDayClick, handleActivityDaysSelect),
        [activityDays, handleActivityDayClick, handleActivityDaysSelect],
    );
    const columnFilters = useMemo(
        () => [
            ...(statusFilter ? [{ id: 'status', value: statusFilter }] : []),
            ...(hasDateRangeValue(dateRange) ? [{ id: 'start_time', value: dateRange }] : []),
        ],
        [dateRange, statusFilter],
    );
    const activityPageBase = predictionSetupId
        ? `/predictions/${encodeURIComponent(predictionSetupId)}/activity`
        : '/jobs';
    const activityPageSearchParams = new URLSearchParams();

    if (statusFilter) {
        activityPageSearchParams.set('status', statusFilter);
    }

    if (dateRange.fromDate) {
        activityPageSearchParams.set('fromDate', dateRange.fromDate);
    }

    if (dateRange.toDate) {
        activityPageSearchParams.set('toDate', dateRange.toDate);
    }

    const activityPageQuery = activityPageSearchParams.toString();
    const jobsPageTo = activityPageQuery
        ? `${activityPageBase}?${activityPageQuery}`
        : activityPageBase;

    const columns = useMemo(() => [
        columnHelper.accessor('status', {
            header: () => i18n.t('Status'),
            filterFn: 'equals',
            enableSorting: false,
            cell: info => (
                <StatusCell status={info.getValue()} />
            ),
        }),
        columnHelper.accessor('name', {
            header: () => i18n.t('Name'),
        }),
        columnHelper.accessor('start_time', {
            header: () => i18n.t('Started'),
            filterFn: (row, _columnId, filterValue) => (
                isJobInActivityDateRange(row.original, filterValue as DateRangeValue)
            ),
            cell: info => formatDateTime(info.getValue()),
        }),
        columnHelper.accessor('end_time', {
            header: () => i18n.t('Finished'),
            cell: info => formatDateTime(info.getValue()),
        }),
        columnHelper.display({
            id: 'duration',
            header: () => i18n.t('Duration'),
            cell: info => formatJobDuration(info.row.original),
        }),
        columnHelper.display({
            id: 'actions',
            header: () => i18n.t('Actions'),
            enableSorting: false,
            cell: info => (
                <JobActionsMenu
                    jobId={info.row.original.id}
                    result={info.row.original.result}
                    status={info.row.original.status}
                    type={info.row.original.type}
                    showGoToResult={false}
                    allowDeleteSuccess={false}
                />
            ),
        }),
    ], []);

    const table = useReactTable({
        data: jobs,
        columns,
        state: {
            sorting,
            columnFilters,
            pagination: {
                pageIndex: 0,
                pageSize: MAX_VISIBLE_ROWS,
            },
        },
        getRowId: row => row.id,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
    });
    const hasVisibleRows = table.getRowModel().rows.length > 0;

    return (
        <Widget
            header={i18n.t('Recent activity')}
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
                        {i18n.t('Error loading jobs')}
                    </div>
                )}
                {!isLoading && !hasError && !hasValidPredictionSetupId && (
                    <div className={styles.emptyState}>
                        {i18n.t('Invalid prediction setup')}
                    </div>
                )}
                {!isLoading && !hasError && hasValidPredictionSetupId && jobs.length === 0 && (
                    <div className={styles.emptyState}>
                        {i18n.t('No activity yet. Run a prediction to see job status and logs here.')}
                    </div>
                )}
                {!isLoading && !hasError && hasValidPredictionSetupId && jobs.length > 0 && (
                    <>
                        <div className={styles.viewBar}>
                            <div className={styles.tabs} role="tablist" aria-label={i18n.t('Activity view')}>
                                <button
                                    className={activityView === 'chart' ? styles.activeTab : styles.tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={activityView === 'chart'}
                                    onClick={() => setActivityView('chart')}
                                >
                                    {i18n.t('Chart')}
                                </button>
                                <button
                                    className={activityView === 'table' ? styles.activeTab : styles.tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={activityView === 'table'}
                                    onClick={() => setActivityView('table')}
                                >
                                    {i18n.t('Table')}
                                </button>
                            </div>
                            {activityView === 'chart' && (
                                <div className={styles.periodSelect}>
                                    <SingleSelect
                                        dense
                                        selected={selectedPeriod}
                                        onChange={(event) => {
                                            if (isActivityPeriodValue(event.selected)) {
                                                setSelectedPeriod(event.selected);
                                            }
                                        }}
                                    >
                                        {ACTIVITY_PERIOD_OPTIONS.map(option => (
                                            <MenuItem
                                                key={option.value}
                                                label={option.label()}
                                                value={option.value}
                                            />
                                        ))}
                                    </SingleSelect>
                                </div>
                            )}
                        </div>
                        {activityView === 'chart' && (
                            <div className={styles.chart}>
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={chartOptions}
                                />
                            </div>
                        )}
                        {activityView === 'table' && (
                            <>
                                <div className={styles.filterBar}>
                                    <div className={styles.filterControls}>
                                        <div className={styles.statusFilter}>
                                            <SingleSelect
                                                dense
                                                clearable
                                                clearText={i18n.t('Clear')}
                                                selected={statusFilter}
                                                placeholder={i18n.t('All statuses')}
                                                onChange={event => setStatusFilter(event.selected)}
                                            >
                                                <MenuItem
                                                    label={i18n.t('Pending')}
                                                    value={JOB_STATUSES.PENDING}
                                                />
                                                <MenuItem
                                                    label={i18n.t('Running')}
                                                    value={JOB_STATUSES.STARTED}
                                                />
                                                <MenuItem
                                                    label={i18n.t('Success')}
                                                    value={JOB_STATUSES.SUCCESS}
                                                />
                                                <MenuItem
                                                    label={i18n.t('Failed')}
                                                    value={JOB_STATUSES.FAILED}
                                                />
                                                <MenuItem
                                                    label={i18n.t('Cancelled')}
                                                    value={JOB_STATUSES.REVOKED}
                                                />
                                            </SingleSelect>
                                        </div>
                                        <div className={styles.dateFilter}>
                                            <DateRangePicker
                                                value={dateRange}
                                                onChange={setDateRange}
                                            />
                                        </div>
                                    </div>
                                    <Link className={styles.viewAllLink} to={jobsPageTo}>
                                        {i18n.t('View all activity')}
                                    </Link>
                                </div>
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
                                        {hasVisibleRows ? table.getRowModel().rows.map(row => (
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
                                                    {i18n.t('No activity matches the selected filters')}
                                                </DataTableCell>
                                            </DataTableRow>
                                        )}
                                    </DataTableBody>
                                </DataTable>
                            </>
                        )}
                    </>
                )}
            </div>
        </Widget>
    );
};
