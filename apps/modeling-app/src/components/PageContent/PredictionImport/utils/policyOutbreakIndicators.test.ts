import { describe, expect, it } from 'vitest';
import type { AlertPolicyRead, PredictionEntry, PredictionOrgUnitSeries, ThresholdResponse } from '@dhis2-chap/ui';
import { buildPolicyOutbreakIndicators, getAlertLevelQuantile } from './policyOutbreakIndicators';
import { transformOutbreakIndicatorsToDataValues } from './predictionImportDataValues';

const policy: AlertPolicyRead = {
    id: 1, name: 'Warning levels', created: null, noAlertOutputCode: '0',
    levels: [
        { name: 'Orange', outputCode: '1', thresholdParams: { type: 'seasonal', stdMultiplier: 1 }, exceedanceThreshold: 0.5 },
        { name: 'Red', outputCode: '2', thresholdParams: { type: 'seasonal', stdMultiplier: 2 }, exceedanceThreshold: 0.75 },
    ],
};
const series: PredictionOrgUnitSeries[] = [{
    targetId: 'disease_cases', orgUnitId: 'region', orgUnitName: 'Region',
    points: ['2025W01', '2025W02', '2025W03'].map(period => ({ period, periodLabel: period, quantiles: { quantile_low: 0, quantile_mid_low: 0, median: 0, quantile_mid_high: 0, quantile_high: 0 } })),
}];
const entries: PredictionEntry[] = [
    { orgUnit: 'region', period: '2025W1', quantile: 0.5, value: 5 },
    { orgUnit: 'region', period: '2025W1', quantile: 0.25, value: 3 },
    { orgUnit: 'region', period: '2025W2', quantile: 0.5, value: 15 },
    { orgUnit: 'region', period: '2025W2', quantile: 0.25, value: 12 },
    { orgUnit: 'region', period: '2025W3', quantile: 0.5, value: 30 },
    { orgUnit: 'region', period: '2025W3', quantile: 0.25, value: 25 },
];
const thresholds: ThresholdResponse[] = [10, 20].map(threshold => ({
    lines: [threshold],
    params: { type: 'seasonal', stdMultiplier: threshold },
    entries: ['2025W1', '2025W2', '2025W3'].map(period => ({ location: 'region', period, values: [threshold] })),
}));

const build = (overrides: { entries?: PredictionEntry[]; thresholds?: ThresholdResponse[] } = {}) => (
    buildPolicyOutbreakIndicators(series, policy, overrides.entries ?? entries, overrides.thresholds ?? thresholds)
);

describe('policy outbreak indicators', () => {
    it('imports no alert and the highest reached level once per region and period', () => {
        expect(transformOutbreakIndicatorsToDataValues(build(), 'indicator')).toEqual([
            { dataElement: 'indicator', orgUnit: 'region', period: '2025W01', value: '0' },
            { dataElement: 'indicator', orgUnit: 'region', period: '2025W02', value: '1' },
            { dataElement: 'indicator', orgUnit: 'region', period: '2025W03', value: '2' },
        ]);
    });

    it('uses policy order rather than numeric or alphabetical code order', () => {
        const customCodes: AlertPolicyRead = {
            ...policy,
            noAlertOutputCode: 'GREEN',
            levels: [{ ...policy.levels![0], outputCode: '99' }, { ...policy.levels![1], outputCode: '1' }],
        };
        expect(buildPolicyOutbreakIndicators(series, customCodes, entries, thresholds).map(item => item.value))
            .toEqual(['GREEN', '99', '1']);
    });

    it('skips absent or non-finite results instead of reporting no alert', () => {
        expect(build({ entries: entries.filter(entry => entry.period !== '2025W1') }).map(item => item.value)).toEqual(['1', '2']);
        expect(build({ entries: entries.map(entry => entry.period === '2025W1' ? { ...entry, value: NaN } : entry) }))
            .toHaveLength(2);
        expect(build({ thresholds: [] })).toEqual([]);
    });

    it('skips an indeterminate higher level even when a lower level fires', () => {
        const missingHigherThreshold = structuredClone(thresholds);
        missingHigherThreshold[1].entries[1].values = [null];
        expect(build({ thresholds: missingHigherThreshold }).map(item => item.value)).toEqual(['0', '2']);
    });

    it('does not require a lower threshold after the highest level has fired', () => {
        const missingLowerThreshold = structuredClone(thresholds);
        missingLowerThreshold[0].entries[2].values = [null];
        expect(build({ thresholds: missingLowerThreshold }).map(item => item.value)).toEqual(['0', '1', '2']);
    });

    it('requests the matching quantile without rounding to a probability preset', () => {
        expect(getAlertLevelQuantile({ ...policy.levels![0], exceedanceThreshold: 0.8 })).toBe(0.2);
    });
});
