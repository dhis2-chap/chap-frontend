import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatasetsService, type AlertLevel, type PredictionOrgUnitSeries } from '@dhis2-chap/ui';
import { afterEach, expect, it, vi } from 'vitest';
import { useAlertPolicyThresholds } from './useAlertPolicyThresholds';

vi.mock('@dhis2-chap/ui', async () => ({
    ...await import('../../../../packages/ui/src/utils/outbreakAlerts'),
    ...await import('../../../../packages/ui/src/utils/chartPeriods'),
    OpenAPI: { BASE: 'http://chap.test' },
    DatasetsService: { computeThresholdsV1AnalyticsThresholdsPost: vi.fn() },
}));

const computeThresholds = vi.mocked(DatasetsService.computeThresholdsV1AnalyticsThresholdsPost);
const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: Infinity } } });
const series: PredictionOrgUnitSeries[] = ['region-a', 'region-b'].map(orgUnitId => ({
    orgUnitId,
    orgUnitName: orgUnitId,
    targetId: 'disease_cases',
    actualCases: [{ period: '202501', value: 5 }],
    points: [{
        period: '202502',
        periodLabel: 'February 2025',
        quantiles: { quantile_low: 1, quantile_mid_low: 2, median: 3, quantile_mid_high: 4, quantile_high: 5 },
    }],
}));

afterEach(() => {
    client.clear();
    vi.resetAllMocks();
});

const loadThresholds = async (paramsList: AlertLevel['thresholdParams'][]) => {
    let result: ReturnType<typeof useAlertPolicyThresholds>;
    const Thresholds = () => {
        result = useAlertPolicyThresholds({
            datasetId: 42,
            series,
            policies: [{
                id: 1,
                name: 'Signal policy',
                created: null,
                levels: paramsList.map((thresholdParams, index) => ({
                    name: `Level ${index}`,
                    outputCode: String(index + 1),
                    exceedanceThreshold: 0.5,
                    thresholdParams,
                })),
            }],
            enabled: true,
        });
        return null;
    };
    const render = () => renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Thresholds)));
    render();
    // Static rendering registers the query without fetching it.
    await client.getQueryCache().find({ queryKey: ['alert-policy-thresholds'], exact: false })!.fetch();
    render();
    return result!;
};

it('fetches distinct seasonal thresholds together and maps response values to their labeled lines', async () => {
    computeThresholds.mockResolvedValue({
        params: { type: 'seasonal', stdMultiplier: [2, 1] },
        lines: [2, 1],
        entries: [
            { location: 'region-a', period: '202501', values: [20, 10] },
            { location: 'region-a', period: '202502', values: [null, 0] },
            { location: 'region-b', period: '202501', values: [40, 30] },
            { location: 'region-b', period: '202502', values: [50, null] },
        ],
    });

    const result = await loadThresholds([
        { type: 'seasonal', stdMultiplier: 1 },
        { type: 'seasonal', stdMultiplier: [2] },
        { type: 'seasonal', stdMultiplier: 1 },
    ]);

    expect(computeThresholds).toHaveBeenCalledExactlyOnceWith({
        datasetId: 42,
        periodIds: ['202501', '202502'],
        locations: ['region-a', 'region-b'],
        params: { type: 'seasonal', stdMultiplier: [1, 2] },
    });
    expect(result.isReady).toBe(true);
    expect(result.linesByOrgUnit).toEqual(new Map([
        ['region-a', [
            { label: 'mean + 1 SD', points: [{ period: '202501', value: 10 }, { period: '202502', value: 0 }] },
            { label: 'mean + 2 SD', points: [{ period: '202501', value: 20 }, { period: '202502', value: null }] },
        ]],
        ['region-b', [
            { label: 'mean + 1 SD', points: [{ period: '202501', value: 30 }, { period: '202502', value: null }] },
            { label: 'mean + 2 SD', points: [{ period: '202501', value: 40 }, { period: '202502', value: 50 }] },
        ]],
    ]));
});

it('keeps a single seasonal line and percentile baselines in separate requests', async () => {
    const paramsList = [
        { type: 'percentile', quantile: 0.75, baselineYears: 5 },
        { type: 'seasonal', stdMultiplier: 1 },
        { type: 'percentile', quantile: 0.75, baselineYears: null },
    ];
    paramsList.forEach((params, index) => computeThresholds.mockResolvedValueOnce({
        params,
        lines: [params.quantile ?? params.stdMultiplier!],
        entries: [{ location: 'region-a', period: '202502', values: [index * 10] }],
    }));

    const result = await loadThresholds(paramsList);

    expect(computeThresholds.mock.calls.map(([request]) => request.params)).toEqual(paramsList);
    expect(result.linesByOrgUnit.get('region-a')).toEqual([
        { label: '75th percentile, 5-year baseline', points: [{ period: '202502', value: 0 }] },
        { label: 'mean + 1 SD', points: [{ period: '202502', value: 10 }] },
        { label: '75th percentile, all history', points: [{ period: '202502', value: 20 }] },
    ]);
});
