import { describe, expect, it } from 'vitest';
import {
    getDateRangeBounds,
    isJobInDateRange,
    parseDateRangeParam,
} from './jobDateRange';

const timestamp = (
    year: number,
    monthIndex: number,
    day: number,
    hour = 12,
) => new Date(year, monthIndex, day, hour).toISOString();

describe('jobDateRange', () => {
    it('parses strict date range params', () => {
        expect(parseDateRangeParam('2026-05-29')?.getFullYear()).toBe(2026);
        expect(parseDateRangeParam('2026-5-29')).toBeUndefined();
        expect(parseDateRangeParam('not-a-date')).toBeUndefined();
    });

    it('normalizes reversed date range bounds', () => {
        const bounds = getDateRangeBounds({
            fromDate: '2026-05-29',
            toDate: '2026-05-27',
        });

        expect(bounds?.start.getDate()).toBe(27);
        expect(bounds?.end.getDate()).toBe(29);
    });

    it('filters jobs by inclusive start date range', () => {
        const range = {
            fromDate: '2026-05-27',
            toDate: '2026-05-29',
        };

        expect(isJobInDateRange({
            start_time: timestamp(2026, 4, 27, 0),
            end_time: null,
        }, range)).toBe(true);
        expect(isJobInDateRange({
            start_time: timestamp(2026, 4, 29, 23),
            end_time: null,
        }, range)).toBe(true);
        expect(isJobInDateRange({
            start_time: timestamp(2026, 4, 30, 0),
            end_time: null,
        }, range)).toBe(false);
    });

    it('falls back to end time when start time is missing', () => {
        expect(isJobInDateRange({
            start_time: null,
            end_time: timestamp(2026, 4, 29, 10),
        }, {
            fromDate: '2026-05-29',
            toDate: '2026-05-29',
        })).toBe(true);
    });
});
