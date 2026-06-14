import { PERIOD_TYPES } from '@dhis2-chap/core';
import { describe, expect, it } from 'vitest';
import { inferChartPeriodType } from './periods';

describe('inferChartPeriodType', () => {
    it('detects monthly period ids through the shared period engine', () => {
        expect(inferChartPeriodType(['202401', '202402'])).toEqual({
            status: 'valid',
            periodType: PERIOD_TYPES.MONTH,
        });
    });

    it('detects padded and unpadded weekly period ids through the shared period engine', () => {
        expect(inferChartPeriodType(['2024W01', '2024W2'])).toEqual({
            status: 'valid',
            periodType: PERIOD_TYPES.WEEK,
        });
    });

    it('rejects mixed monthly and weekly period ids', () => {
        expect(inferChartPeriodType(['202401', '2024W1'])).toEqual({ status: 'mixed' });
    });

    it('rejects valid DHIS2 period ids that are not supported by the chart', () => {
        expect(inferChartPeriodType(['2024Q1'])).toEqual({ status: 'unsupported' });
    });

    it('rejects invalid period ids', () => {
        expect(inferChartPeriodType(['not-a-period'])).toEqual({ status: 'unsupported' });
    });
});
