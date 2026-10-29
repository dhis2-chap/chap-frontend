import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useQuery } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatasetsService, type AlertPolicyRead, type PredictionOrgUnitSeries } from '@dhis2-chap/ui';
import { useAlertPolicyThresholds } from './useAlertPolicyThresholds';

vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));
// The ui barrel needs a DOM, so pull in only the pure helpers the hook uses.
vi.mock('@dhis2-chap/ui', async () => ({
    ...await import('../../../../packages/ui/src/utils/outbreakAlerts'),
    ...await import('../../../../packages/ui/src/utils/chartPeriods'),
    ApiError: Error,
    DatasetsService: { computeThresholdsV1AnalyticsThresholdsPost: vi.fn() },
    OpenAPI: { BASE: 'test-backend' },
}));

const seasonal = { type: 'seasonal', stdMultiplier: 2 };
const percentile = { type: 'percentile', quantile: 0.75, baselineYears: 5 };
const policies: AlertPolicyRead[] = [{
    id: 3, name: 'Policy', created: null,
    levels: [
        { name: 'Watch', outputCode: '1', exceedanceThreshold: 0.5, thresholdParams: seasonal },
        { name: 'Action', outputCode: '2', exceedanceThreshold: 0.9, thresholdParams: seasonal },
        { name: 'Band', outputCode: '3', exceedanceThreshold: 0.9, thresholdParams: percentile },
    ],
}];
const series: PredictionOrgUnitSeries[] = [{
    orgUnitId: 'region', orgUnitName: 'Region', targetId: 'cases',
    actualCases: [{ period: '2024W1', value: 5 }],
    points: [{
        period: '2024W01', periodLabel: 'Week 1',
        quantiles: { quantile_low: 1, quantile_mid_low: 2, median: 3, quantile_mid_high: 4, quantile_high: 5 },
    }],
}];

const renderHook = (enabled = true, selectedPolicies = policies) => {
    let result: ReturnType<typeof useAlertPolicyThresholds> | undefined;
    const Probe = () => {
        result = useAlertPolicyThresholds({ datasetId: 7, series, policies: selectedPolicies, enabled });
        return null;
    };
    renderToStaticMarkup(createElement(Probe));
    return result!;
};

describe('policy thresholds', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useQuery).mockReturnValue({ data: undefined, fetchStatus: 'idle' } as ReturnType<typeof useQuery>);
    });

    it('draws one line per distinct parameter set, labelled with its strategy', async () => {
        vi.mocked(DatasetsService.computeThresholdsV1AnalyticsThresholdsPost)
            .mockResolvedValueOnce({ params: seasonal, lines: [2], entries: [{ location: 'region', period: '2024W1', values: [10] }] })
            .mockResolvedValueOnce({ params: percentile, lines: [0.75], entries: [{ location: 'region', period: '2024W1', values: [20] }] });
        renderHook();
        const options = vi.mocked(useQuery).mock.calls[0][0] as unknown as { enabled: boolean; queryFn: () => Promise<unknown> };
        expect(options.enabled).toBe(true);
        const data = await options.queryFn();
        expect(vi.mocked(DatasetsService.computeThresholdsV1AnalyticsThresholdsPost).mock.calls).toEqual([
            [{ datasetId: 7, locations: ['region'], periodIds: ['2024W1'], params: seasonal }],
            [{ datasetId: 7, locations: ['region'], periodIds: ['2024W1'], params: percentile }],
        ]);
        vi.mocked(useQuery).mockReturnValue({ data, fetchStatus: 'idle' } as ReturnType<typeof useQuery>);
        expect(renderHook().linesByOrgUnit.get('region')).toEqual([
            { id: 'policy-threshold-0', label: 'Seasonal mean + 2 SD', color: '#212934', points: [{ period: '2024W1', value: 10 }] },
            { id: 'policy-threshold-1', label: '75th percentile, 5-year baseline', color: '#212934', points: [{ period: '2024W1', value: 20 }] },
        ]);
    });

    it.each([false, true])('does not calculate without an active policy (enabled: %s)', (enabled) => {
        renderHook(enabled, enabled ? [] : policies);
        expect(vi.mocked(useQuery).mock.calls[0][0]).toMatchObject({ enabled: false });
    });
});
