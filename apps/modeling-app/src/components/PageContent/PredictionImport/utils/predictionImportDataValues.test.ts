import { describe, expect, it } from 'vitest';
import {
    buildClearDataValues,
    buildClearPeriodIds,
    getSelectedOutputDataElementIds,
    transformPredictionEntriesToDataValues,
} from './predictionImportDataValues';

describe('predictionImportDataValues', () => {
    it('builds a monthly clear window one year around the forecast periods', () => {
        const periods = buildClearPeriodIds({
            forecastPeriodIds: ['202605', '202606'],
            periodType: 'MONTH',
        });
        const monthlyPeriods = periods.filter(period => !period.includes('W'));

        expect(monthlyPeriods).toEqual([
            '202505',
            '202506',
            '202507',
            '202508',
            '202509',
            '202510',
            '202511',
            '202512',
            '202601',
            '202602',
            '202603',
            '202604',
            '202605',
            '202606',
            '202607',
            '202608',
            '202609',
            '202610',
            '202611',
            '202612',
            '202701',
            '202702',
            '202703',
            '202704',
            '202705',
            '202706',
        ]);
        expect(periods).toEqual(expect.arrayContaining([
            '2025W18',
            '2026W1',
            '2027W26',
        ]));
    });

    it('builds a weekly clear window one year around the forecast periods', () => {
        const periods = buildClearPeriodIds({
            forecastPeriodIds: ['2026W2', '2026W1'],
            periodType: 'WEEK',
        });
        const weeklyPeriods = periods.filter(period => period.includes('W'));

        expect(weeklyPeriods).toHaveLength(106);
        expect(weeklyPeriods.slice(0, 3)).toEqual(['2025W1', '2025W2', '2025W3']);
        expect(weeklyPeriods.slice(-3)).toEqual(['2026W52', '2026W53', '2027W1']);
        expect(periods).toEqual(expect.arrayContaining([
            '202501',
            '202601',
            '202701',
        ]));
    });

    it('includes weekly periods that analytics can aggregate into a monthly chart bucket', () => {
        const periods = buildClearPeriodIds({
            forecastPeriodIds: ['202501', '202503'],
            periodType: 'MONTH',
        });

        expect(periods).toEqual(expect.arrayContaining([
            '202412',
            '2024W50',
            '2024W51',
            '2024W52',
        ]));
    });

    it('builds clear data values as a data element, org unit, and period cartesian product', () => {
        const dataValues = buildClearDataValues({
            dataElementIds: ['de-a', 'de-a', 'de-b'],
            orgUnitIds: ['ou-a', 'ou-b'],
            forecastPeriodIds: ['202605'],
            periodType: 'MONTH',
        });

        expect(dataValues).toHaveLength(540);
        expect(dataValues).toEqual(expect.arrayContaining([
            {
                dataElement: 'de-a',
                orgUnit: 'ou-a',
                period: '202505',
            },
            {
                dataElement: 'de-a',
                orgUnit: 'ou-a',
                period: '2025W18',
            },
            {
                dataElement: 'de-b',
                orgUnit: 'ou-b',
                period: '202705',
            },
        ]));
    });

    it('maps standard quantiles to selected data elements and skips non-standard quantiles', () => {
        expect(transformPredictionEntriesToDataValues([
            {
                orgUnit: 'ou-a',
                period: '202605',
                quantile: 0.5,
                value: 12,
            },
            {
                orgUnit: 'ou-a',
                period: '202605',
                quantile: 0.33,
                value: 13,
            },
        ], {
            quantileLowId: 'low-id',
            quantileMedianId: 'median-id',
            quantileHighId: 'high-id',
            quantileMidLowId: 'mid-low-id',
            quantileMidHighId: 'mid-high-id',
            outbreakIndicatorId: '',
        })).toEqual([
            {
                dataElement: 'median-id',
                orgUnit: 'ou-a',
                period: '202605',
                value: '12',
            },
        ]);
    });

    it('deduplicates selected output data elements', () => {
        expect(getSelectedOutputDataElementIds({
            quantileLowId: 'low-id',
            quantileMedianId: 'median-id',
            quantileHighId: 'high-id',
            quantileMidLowId: 'median-id',
            quantileMidHighId: 'mid-high-id',
            outbreakIndicatorId: '',
        })).toEqual([
            'high-id',
            'mid-high-id',
            'median-id',
            'low-id',
        ]);
    });
});
