import type { HighChartsData } from '@dhis2-chap/ui';

/** Periods of history drawn before the first forecast, for context. */
const HISTORY_PERIODS = 12;

export type ForecastOverview = {
    data: HighChartsData;
    /** Forecast periods with an actual value. */
    scored: number;
    /** Of those, the periods where the actual value was inside the predicted range. */
    inside: number;
};

/**
 * One series over every evaluated period, from an evaluation's forecast windows ordered by when
 * they were made. A period that several windows predicted keeps the forecast made longest before
 * it, the hardest one, so the picture does not flatter the model.
 */
export const stitchForecasts = (windows: HighChartsData[]): ForecastOverview => {
    const data: Required<HighChartsData> = { periods: [], ranges: [], averages: [], midranges: [], realValues: [] };
    const [first] = windows;
    const firstForecast = first?.ranges.findIndex(range => range != null) ?? -1;
    if (!first || firstForecast === -1) return { data, scored: 0, inside: 0 };

    for (let index = Math.max(0, firstForecast - HISTORY_PERIODS); index < firstForecast; index++) {
        data.periods.push(first.periods[index]);
        data.ranges.push(null);
        data.averages.push(null);
        data.midranges.push(null);
        data.realValues.push(first.realValues?.[index] ?? null);
    }
    windows.forEach(window => window.periods.forEach((period, index) => {
        if (window.ranges[index] == null || data.periods.includes(period)) return;
        data.periods.push(period);
        data.ranges.push(window.ranges[index]);
        data.averages.push(window.averages[index]);
        data.midranges.push(window.midranges?.[index] ?? null);
        data.realValues.push(window.realValues?.[index] ?? null);
    }));

    const scored = data.ranges.flatMap((range, index) => {
        const actual = data.realValues[index];
        return range && actual != null ? [actual >= range[0] && actual <= range[1]] : [];
    });
    return { data, scored: scored.length, inside: scored.filter(Boolean).length };
};
