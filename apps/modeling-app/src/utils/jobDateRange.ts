import {
    endOfDay,
    format,
    isAfter,
    isBefore,
    isValid,
    parse,
    startOfDay,
} from 'date-fns';

export const DATE_RANGE_FORMAT = 'yyyy-MM-dd';

export type DateRangeValue = {
    fromDate?: string;
    toDate?: string;
};

type JobActivityDateSource = {
    start_time?: string | null;
    end_time?: string | null;
};

export const formatDateRangeParam = (date: Date) => format(date, DATE_RANGE_FORMAT);

export const parseDateRangeParam = (value?: string | null) => {
    if (!value) {
        return undefined;
    }

    const parsedDate = parse(value, DATE_RANGE_FORMAT, new Date());

    if (!isValid(parsedDate) || formatDateRangeParam(parsedDate) !== value) {
        return undefined;
    }

    return startOfDay(parsedDate);
};

export const hasDateRangeValue = (range: DateRangeValue) => (
    !!parseDateRangeParam(range.fromDate) || !!parseDateRangeParam(range.toDate)
);

export const getDateRangeBounds = (range: DateRangeValue) => {
    const from = parseDateRangeParam(range.fromDate);
    const to = parseDateRangeParam(range.toDate);

    if (!from && !to) {
        return undefined;
    }

    const lowerBound = from ?? to;
    const upperBound = to ?? from;

    if (!lowerBound || !upperBound) {
        return undefined;
    }

    const start = startOfDay(lowerBound);
    const end = endOfDay(upperBound);

    if (isAfter(start, end)) {
        return {
            start: startOfDay(upperBound),
            end: endOfDay(lowerBound),
        };
    }

    return { start, end };
};

export const getJobActivityDate = (job: JobActivityDateSource) => {
    const timestamp = job.start_time ?? job.end_time;

    if (!timestamp) {
        return undefined;
    }

    const date = new Date(timestamp);

    return isValid(date) ? date : undefined;
};

export const isJobInDateRange = (
    job: JobActivityDateSource,
    range: DateRangeValue,
) => {
    const bounds = getDateRangeBounds(range);

    if (!bounds) {
        return true;
    }

    const activityDate = getJobActivityDate(job);

    if (!activityDate) {
        return false;
    }

    return !isBefore(activityDate, bounds.start) && !isAfter(activityDate, bounds.end);
};
