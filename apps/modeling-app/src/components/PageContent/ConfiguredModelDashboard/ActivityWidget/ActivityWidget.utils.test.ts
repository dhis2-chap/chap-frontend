import { describe, expect, it } from 'vitest';
import { buildJobActivityDays, isJobInActivityDateRange } from './ActivityWidget.utils';

const timestamp = (
    year: number,
    monthIndex: number,
    day: number,
    hour = 12,
) => new Date(year, monthIndex, day, hour).toISOString();

describe('buildJobActivityDays', () => {
    it('returns one bucket per day in the selected period', () => {
        const days = buildJobActivityDays([], 3, new Date(2026, 4, 29, 12));

        expect(days.map(day => day.key)).toEqual([
            '2026-05-27',
            '2026-05-28',
            '2026-05-29',
        ]);
        expect(days.map(day => ({
            activeCount: day.activeCount,
            failedCount: day.failedCount,
            successCount: day.successCount,
        }))).toEqual([
            { activeCount: 0, failedCount: 0, successCount: 0 },
            { activeCount: 0, failedCount: 0, successCount: 0 },
            { activeCount: 0, failedCount: 0, successCount: 0 },
        ]);
    });

    it('counts successful and failed jobs by start time inside the selected period', () => {
        const days = buildJobActivityDays([
            { start_time: timestamp(2026, 4, 29, 9), end_time: null, status: 'SUCCESS' },
            { start_time: timestamp(2026, 4, 27, 23), end_time: null, status: 'SUCCESS' },
            { start_time: timestamp(2026, 4, 27, 1), end_time: null, status: 'FAILURE' },
            { start_time: timestamp(2026, 4, 26, 23), end_time: null, status: 'SUCCESS' },
        ], 3, new Date(2026, 4, 29, 12));

        expect(days.map(day => ({
            key: day.key,
            failedCount: day.failedCount,
            successCount: day.successCount,
        }))).toEqual([
            { key: '2026-05-27', failedCount: 1, successCount: 1 },
            { key: '2026-05-28', failedCount: 0, successCount: 0 },
            { key: '2026-05-29', failedCount: 0, successCount: 1 },
        ]);
    });

    it('falls back to end time when a job has no start time', () => {
        const days = buildJobActivityDays([
            { start_time: null, end_time: timestamp(2026, 4, 29, 11), status: 'FAILURE' },
            { start_time: null, end_time: null, status: 'SUCCESS' },
        ], 1, new Date(2026, 4, 29, 12));

        expect(days).toHaveLength(1);
        expect(days[0].failedCount).toBe(1);
        expect(days[0].successCount).toBe(0);
    });

    it('counts pending and running jobs as active on the current day', () => {
        const days = buildJobActivityDays([
            { start_time: null, end_time: null, status: 'PENDING' },
            { start_time: timestamp(2026, 4, 27, 9), end_time: null, status: 'STARTED' },
            { start_time: timestamp(2026, 4, 29, 10), end_time: null, status: 'SUCCESS' },
        ], 3, new Date(2026, 4, 29, 12));

        expect(days.map(day => ({
            key: day.key,
            activeCount: day.activeCount,
            successCount: day.successCount,
        }))).toEqual([
            { key: '2026-05-27', activeCount: 0, successCount: 0 },
            { key: '2026-05-28', activeCount: 0, successCount: 0 },
            { key: '2026-05-29', activeCount: 2, successCount: 1 },
        ]);
    });

    it('filters active jobs by the current activity date', () => {
        const now = new Date(2026, 4, 29, 12);

        expect(isJobInActivityDateRange({
            start_time: null,
            end_time: null,
            status: 'PENDING',
        }, {
            fromDate: '2026-05-29',
            toDate: '2026-05-29',
        }, now)).toBe(true);

        expect(isJobInActivityDateRange({
            start_time: timestamp(2026, 4, 27, 9),
            end_time: null,
            status: 'STARTED',
        }, {
            fromDate: '2026-05-29',
            toDate: '2026-05-29',
        }, now)).toBe(true);

        expect(isJobInActivityDateRange({
            start_time: null,
            end_time: null,
            status: 'PENDING',
        }, {
            fromDate: '2026-05-28',
            toDate: '2026-05-28',
        }, now)).toBe(false);
    });

    it('ignores invalid timestamps and jobs after now', () => {
        const days = buildJobActivityDays([
            { start_time: 'not-a-date', end_time: null, status: 'SUCCESS' },
            { start_time: timestamp(2026, 4, 29, 13), end_time: null, status: 'SUCCESS' },
            { start_time: timestamp(2026, 4, 29, 11), end_time: null, status: 'FAILURE' },
        ], 1, new Date(2026, 4, 29, 12));

        expect(days).toHaveLength(1);
        expect(days[0].failedCount).toBe(1);
        expect(days[0].successCount).toBe(0);
    });
});
