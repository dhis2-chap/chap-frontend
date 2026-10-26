import { describe, expect, it } from 'vitest';
import type { PredictionOrgUnitSeries } from '../../interfaces/Prediction';
import {
    buildChartPeriods,
    buildPeriodIndexLookup,
    dedupeSeriesPeriods,
    getSeriesLocations,
    getSeriesPeriods,
} from '../chartPeriods';

describe('buildChartPeriods', () => {
    it('merges padded and unpadded weekly period ids into one category', () => {
        const periods = buildChartPeriods(['2025W1', '2025W2', '2025W3', '2025W03', '2025W04']);

        expect(periods).toEqual(['2025W1', '2025W2', '2025W3', '2025W04']);
    });

    it('sorts merged periods chronologically, not by source order', () => {
        const actuals = ['2024W50', '2024W52', '2025W2'];
        const predictions = ['2024W52', '2025W01', '2025W02', '2025W03'];

        const periods = buildChartPeriods([...actuals, ...predictions]);

        expect(periods).toEqual(['2024W50', '2024W52', '2025W01', '2025W2', '2025W03']);
    });

    it('sorts weekly periods across year boundaries', () => {
        const periods = buildChartPeriods(['2021W1', '2020W53', '2020W9', '2020W10']);

        expect(periods).toEqual(['2020W9', '2020W10', '2020W53', '2021W1']);
    });
});

describe('getSeriesPeriods', () => {
    const quantiles = {
        quantile_low: 1,
        quantile_mid_low: 2,
        median: 3,
        quantile_mid_high: 4,
        quantile_high: 5,
    };
    const series: PredictionOrgUnitSeries = {
        targetId: 'target-a',
        orgUnitId: 'ou-a',
        orgUnitName: 'A',
        actualCases: [
            { period: '202401', value: 10 },
            { period: '202402', value: 12 },
        ],
        points: [
            { period: '202403', periodLabel: '202403', quantiles },
        ],
    };

    it('returns the actual case periods followed by the forecast periods', () => {
        expect(getSeriesPeriods(series)).toEqual(['202401', '202402', '202403']);
    });

    it('handles a series without actual cases', () => {
        expect(getSeriesPeriods({ ...series, actualCases: undefined })).toEqual(['202403']);
    });
});

describe('dedupeSeriesPeriods', () => {
    const quantiles = {
        quantile_low: 1,
        quantile_mid_low: 2,
        median: 3,
        quantile_mid_high: 4,
        quantile_high: 5,
    };
    const makeSeries = (
        orgUnitId: string,
        actualPeriods: string[],
        pointPeriods: string[],
    ): PredictionOrgUnitSeries => ({
        targetId: `target-${orgUnitId}`,
        orgUnitId,
        orgUnitName: orgUnitId,
        actualCases: actualPeriods.map(period => ({ period, value: 1 })),
        points: pointPeriods.map(period => ({ period, periodLabel: period, quantiles })),
    });

    it('collapses padded and unpadded weekly ids, keeping the first spelling', () => {
        const series = [
            makeSeries('ou-a', ['2025W1', '2025W2', '2025W3'], ['2025W03', '2025W04']),
        ];

        expect(dedupeSeriesPeriods(series)).toEqual(['2025W1', '2025W2', '2025W3', '2025W04']);
    });

    it('deduplicates across series while preserving first-seen order', () => {
        const series = [
            makeSeries('ou-a', ['2025W2'], ['2025W4']),
            makeSeries('ou-b', ['2025W1', '2025W02'], ['2025W04', '2025W5']),
        ];

        expect(dedupeSeriesPeriods(series)).toEqual(['2025W2', '2025W4', '2025W1', '2025W5']);
    });

    it('returns an empty list for an empty series', () => {
        expect(dedupeSeriesPeriods([])).toEqual([]);
    });

    it('returns an empty list when no series has periods', () => {
        const series = [makeSeries('ou-a', [], [])];

        expect(dedupeSeriesPeriods(series)).toEqual([]);
    });
});

describe('getSeriesLocations', () => {
    it('returns the org unit id of each series in order', () => {
        const series = [
            { orgUnitId: 'ou-a' },
            { orgUnitId: 'ou-b' },
        ] as PredictionOrgUnitSeries[];

        expect(getSeriesLocations(series)).toEqual(['ou-a', 'ou-b']);
    });

    it('returns an empty list for an empty series', () => {
        expect(getSeriesLocations([])).toEqual([]);
    });
});

describe('buildPeriodIndexLookup', () => {
    it('resolves both padded and unpadded ids to the same index', () => {
        const getPeriodIndex = buildPeriodIndexLookup(['2025W1', '2025W2', '2025W3']);

        expect(getPeriodIndex('2025W03')).toBe(2);
        expect(getPeriodIndex('2025W3')).toBe(2);
        expect(getPeriodIndex('2025W04')).toBeUndefined();
    });
});
