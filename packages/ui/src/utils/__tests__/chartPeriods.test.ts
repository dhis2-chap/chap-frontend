import { describe, expect, it } from 'vitest';
import { buildChartPeriods, buildPeriodIndexLookup } from '../chartPeriods';

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

describe('buildPeriodIndexLookup', () => {
    it('resolves both padded and unpadded ids to the same index', () => {
        const getPeriodIndex = buildPeriodIndexLookup(['2025W1', '2025W2', '2025W3']);

        expect(getPeriodIndex('2025W03')).toBe(2);
        expect(getPeriodIndex('2025W3')).toBe(2);
        expect(getPeriodIndex('2025W04')).toBeUndefined();
    });
});
