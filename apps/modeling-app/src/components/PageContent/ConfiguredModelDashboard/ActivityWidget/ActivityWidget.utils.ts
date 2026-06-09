import { eachDayOfInterval, format, isAfter, isBefore, startOfDay, subDays } from 'date-fns';
import type { JobDescription } from '@dhis2-chap/ui';

type JobActivity = Pick<JobDescription, 'start_time' | 'end_time' | 'status'>;

export type JobActivityDay = {
    key: string;
    label: string;
    failedCount: number;
    successCount: number;
};

const FAILED_JOB_STATUS = 'FAILURE';
const SUCCESS_JOB_STATUS = 'SUCCESS';

const getDayKey = (date: Date) => format(date, 'yyyy-MM-dd');

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const getJobActivityTimestamp = (job: JobActivity) => (
    job.start_time ?? job.end_time
);

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
            failedCount: 0,
            successCount: 0,
        },
    ]));

    jobs.forEach((job) => {
        const timestamp = getJobActivityTimestamp(job);

        if (!timestamp) {
            return;
        }

        const jobDate = new Date(timestamp);

        if (
            !isValidDate(jobDate)
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
        failedCount: countsByDay.get(getDayKey(day))?.failedCount ?? 0,
        successCount: countsByDay.get(getDayKey(day))?.successCount ?? 0,
    }));
};
