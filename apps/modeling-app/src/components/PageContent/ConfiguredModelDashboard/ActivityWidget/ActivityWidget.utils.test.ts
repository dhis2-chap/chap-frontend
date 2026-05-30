import { describe, expect, it } from 'vitest';
import { buildJobActivityDays } from './ActivityWidget.utils';

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
            failedCount: day.failedCount,
            successCount: day.successCount,
        }))).toEqual([
            { failedCount: 0, successCount: 0 },
            { failedCount: 0, successCount: 0 },
            { failedCount: 0, successCount: 0 },
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
