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

const policies: AlertPolicyRead[] = [{
    id: 3, name: 'Policy', created: null,
    levels: [
        { name: 'Watch', exceedanceThreshold: 0.5, thresholdParams: { type: 'seasonal', stdMultiplier: 2 } },
        { name: 'Action', exceedanceThreshold: 0.9, thresholdParams: { type: 'percentile', quantile: [0.25, 0.75], baselineYears: null } },
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
        result = useAlertPolicyThresholds({
            datasetId: 7, series, policies: selectedPolicies, enabled,
            displays: { 3: { Watch: { color: '#123456' } } },
        });
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

    it('computes every saved level with its own parameters and draws its upper line', async () => {
        vi.mocked(DatasetsService.computeThresholdsV1AnalyticsThresholdsPost)
            .mockResolvedValueOnce({ params: policies[0].levels![0].thresholdParams, lines: [2], entries: [{ location: 'region', period: '2024W1', values: [10] }] })
            .mockResolvedValueOnce({ params: policies[0].levels![1].thresholdParams, lines: [0.25, 0.75], entries: [{ location: 'region', period: '2024W1', values: [4, 20] }] });
        renderHook();
        const options = vi.mocked(useQuery).mock.calls[0][0] as unknown as { enabled: boolean; queryFn: () => Promise<unknown> };
        expect(options.enabled).toBe(true);
        const data = await options.queryFn();
        expect(vi.mocked(DatasetsService.computeThresholdsV1AnalyticsThresholdsPost).mock.calls).toEqual(
            policies[0].levels!.map(level => [{
                datasetId: 7, locations: ['region'], periodIds: ['2024W1'], params: level.thresholdParams,
            }]),
        );
        vi.mocked(useQuery).mockReturnValue({ data, fetchStatus: 'idle' } as ReturnType<typeof useQuery>);
        expect(renderHook().linesByOrgUnit.get('region')).toEqual([
            { id: 'policy-threshold-3-Watch', label: 'Policy: Watch', color: '#123456', points: [{ period: '2024W1', value: 10 }] },
            { id: 'policy-threshold-3-Action', label: 'Policy: Action', color: '#e53935', points: [{ period: '2024W1', value: 20, lowerValue: 4 }] },
        ]);
    });

    it.each([false, true])('does not calculate without an active policy (enabled: %s)', (enabled) => {
        renderHook(enabled, enabled ? [] : policies);
        expect(vi.mocked(useQuery).mock.calls[0][0]).toMatchObject({ enabled: false });
    });
});
