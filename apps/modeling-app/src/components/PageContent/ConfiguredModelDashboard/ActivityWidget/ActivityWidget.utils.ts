import { eachDayOfInterval, format, isAfter, isBefore, startOfDay, subDays } from 'date-fns';
import type { JobDescription } from '@dhis2-chap/ui';
import { getDateRangeBounds, type DateRangeValue } from '../../../../utils/jobDateRange';

type JobActivity = Pick<JobDescription, 'start_time' | 'end_time' | 'status'>;

export type JobActivityDay = {
    key: string;
    label: string;
    activeCount: number;
    failedCount: number;
    successCount: number;
};

const ACTIVE_JOB_STATUSES = new Set(['PENDING', 'STARTED']);
const FAILED_JOB_STATUS = 'FAILURE';
const SUCCESS_JOB_STATUS = 'SUCCESS';

const getDayKey = (date: Date) => format(date, 'yyyy-MM-dd');

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const isActiveJob = (job: JobActivity) => ACTIVE_JOB_STATUSES.has(job.status.toUpperCase());

const getJobActivityDate = (job: JobActivity, now: Date) => {
    if (isActiveJob(job)) {
        return now;
    }

    const timestamp = job.start_time ?? job.end_time;

    if (!timestamp) {
        return undefined;
    }

    const date = new Date(timestamp);

    return isValidDate(date) ? date : undefined;
};

export const isJobInActivityDateRange = (
    job: JobActivity,
    range: DateRangeValue,
    now = new Date(),
) => {
    const bounds = getDateRangeBounds(range);

    if (!bounds) {
        return true;
    }

    const activityDate = getJobActivityDate(job, now);

    if (!activityDate) {
        return false;
    }

    return !isBefore(activityDate, bounds.start) && !isAfter(activityDate, bounds.end);
};

export const buildJobActivityDays = (
    jobs: JobActivity[],
    periodDays: number,
    now = new Date(),
): JobActivityDay[] => {
    const normalizedPeriodDays = Math.max(1, Math.floor(periodDays));
    const end = now;
    const start = startOfDay(subDays(end, normalizedPeriodDays - 1));
    const days = eachDayOfInterval({ start, end });
    const countsByDay = new Map(days.map(day => [
        getDayKey(day),
        {
            activeCount: 0,
            failedCount: 0,
            successCount: 0,
        },
    ]));

    jobs.forEach((job) => {
        const jobDate = getJobActivityDate(job, now);

        if (
            !jobDate
            || !isValidDate(jobDate)
            || isBefore(jobDate, start)
            || isAfter(jobDate, end)
        ) {
            return;
        }

        const dayKey = getDayKey(jobDate);
        const counts = countsByDay.get(dayKey);

        if (!counts) {
            return;
        }

        const status = job.status.toUpperCase();

        if (ACTIVE_JOB_STATUSES.has(status)) {
            counts.activeCount += 1;
        }

        if (status === SUCCESS_JOB_STATUS) {
            counts.successCount += 1;
        }

        if (status === FAILED_JOB_STATUS) {
            counts.failedCount += 1;
        }
    });

    return days.map(day => ({
        key: getDayKey(day),
        label: format(day, 'MMM d'),
        activeCount: countsByDay.get(getDayKey(day))?.activeCount ?? 0,
        failedCount: countsByDay.get(getDayKey(day))?.failedCount ?? 0,
        successCount: countsByDay.get(getDayKey(day))?.successCount ?? 0,
    }));
};
