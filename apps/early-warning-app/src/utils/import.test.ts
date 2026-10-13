import { describe, expect, it } from 'vitest';
import type { AlertRead } from '@dhis2-chap/ui';
import { buildReviewDataValues } from './import';

const entries = [
    { orgUnit: 'selected', period: '202401', quantile: 0.5, value: 12 },
    { orgUnit: 'selected', period: '202402', quantile: 0.5, value: 14 },
    { orgUnit: 'other', period: '202401', quantile: 0.5, value: 90 },
];
const targets = [
    { quantile: 'median', dataElementId: 'forecast' },
    { quantile: 'outbreak_indicator', dataElementId: 'indicator' },
];

describe('review forecast imports', () => {
    it('limits forecasts to selected organisation units and indicators to accepted cells', () => {
        const accepted = [{ orgUnit: 'selected', timePeriod: '2024-01' }] as AlertRead[];
        expect(buildReviewDataValues(entries, targets, new Set(['selected']), accepted)).toEqual([
            { dataElement: 'forecast', orgUnit: 'selected', period: '202401', value: '12' },
            { dataElement: 'forecast', orgUnit: 'selected', period: '202402', value: '14' },
            { dataElement: 'indicator', orgUnit: 'selected', period: '202401', value: '1' },
        ]);
        expect(buildReviewDataValues(entries, targets, new Set(), accepted)).toEqual([]);
    });

    it('converts CHAP month and week IDs to DHIS2 periods', () => {
        expect(buildReviewDataValues([
            { orgUnit: 'selected', period: '2024-01', quantile: 0.5, value: 4 },
            { orgUnit: 'selected', period: '2024-W01', quantile: 0.5, value: 5 },
        ], targets, new Set(['selected']), []).map(value => value.period)).toEqual(['202401', '2024W1']);
    });

    it('deduplicates indicators and omits unmapped or non-finite quantiles', () => {
        const accepted = [{ orgUnit: 'selected', timePeriod: '2024-01' }] as AlertRead[];
        const values = buildReviewDataValues([
            ...entries,
            { orgUnit: 'selected', period: '202401', quantile: 0.9, value: Infinity },
        ], [{ quantile: '0.9', dataElementId: 'upper' }, targets[1]], new Set(['selected']), [...accepted, ...accepted]);
        expect(values).toEqual([{ dataElement: 'indicator', orgUnit: 'selected', period: '202401', value: '1' }]);
    });
});
