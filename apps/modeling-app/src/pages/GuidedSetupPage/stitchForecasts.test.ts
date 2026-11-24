import { describe, expect, it } from 'vitest';
import type { HighChartsData } from '@dhis2-chap/ui';
import { stitchForecasts } from './stitchForecasts';

const PERIODS = ['202401', '202402', '202403', '202404', '202405'];
const ACTUAL = [10, 20, 30, 40, 50];

/** A window that forecasts two periods from `start`, as a range around `median`. */
const forecastWindow = (start: number, median: number): HighChartsData => ({
    periods: PERIODS,
    realValues: ACTUAL,
    ranges: PERIODS.map((_, index) => (index >= start && index < start + 2 ? [median - 5, median + 5] : null)),
    averages: PERIODS.map((_, index) => (index >= start && index < start + 2 ? [median] : null)),
});

describe('stitchForecasts', () => {
    it('joins the windows into one series with the history before them', () => {
        const { data } = stitchForecasts([forecastWindow(2, 30), forecastWindow(3, 50)]);

        expect(data.periods).toEqual(PERIODS);
        expect(data.realValues).toEqual(ACTUAL);
        expect(data.ranges).toEqual([null, null, [25, 35], [25, 35], [45, 55]]);
    });

    it('keeps the forecast made longest before a period', () => {
        const { data } = stitchForecasts([forecastWindow(2, 30), forecastWindow(3, 50)]);

        // 202404 is in both windows; the first one predicted it two periods ahead.
        expect(data.averages[3]).toEqual([30]);
    });

    it('counts the periods where the actual value was inside the predicted range', () => {
        // Ranges: 202403 25-35 (actual 30, inside), 202404 25-35 (actual 40, outside), 202405 45-55 (actual 50, inside).
        expect(stitchForecasts([forecastWindow(2, 30), forecastWindow(3, 50)])).toMatchObject({ scored: 3, inside: 2 });
    });

    it('is empty without forecasts', () => {
        expect(stitchForecasts([])).toMatchObject({ scored: 0, inside: 0 });
        expect(stitchForecasts([{ periods: PERIODS, realValues: ACTUAL, ranges: PERIODS.map(() => null), averages: PERIODS.map(() => null) }]).data.periods).toEqual([]);
    });
});
