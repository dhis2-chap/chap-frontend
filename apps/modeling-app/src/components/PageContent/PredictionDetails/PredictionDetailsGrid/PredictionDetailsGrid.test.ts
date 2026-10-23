import { createElement, type ComponentProps, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelSpecRead, PredictionInfo } from '@dhis2-chap/ui';
import { useAlertPolicyThresholds } from '@/hooks/useAlertPolicyThresholds';
import { useEndemicThresholds } from '@/hooks/useEndemicThresholds';
import { useIsFeatureAvailable } from '@/hooks/useIsFeatureAvailable';
import { usePredictionAlerts } from '@/hooks/usePredictionAlerts';
import { ThresholdTilesExplorer } from '../../../ThresholdTilesExplorer';
import { getDefaultPredictionRunAlertSettings, PredictionDetailsGrid } from './PredictionDetailsGrid';

vi.mock('@/hooks/useAlertPolicyThresholds', () => ({ useAlertPolicyThresholds: vi.fn() }));
vi.mock('@/hooks/useEndemicThresholds', () => ({ useEndemicThresholds: vi.fn() }));
vi.mock('@/hooks/usePredictionAlerts', () => ({ usePredictionAlerts: vi.fn() }));
vi.mock('@/hooks/useIsFeatureAvailable', () => ({ Features: { PREDICTION_ALERTS: 'alerts' }, useIsFeatureAvailable: vi.fn() }));
vi.mock('../hooks/usePredictionSeries', () => ({
    usePredictionSeries: () => ({
        predictionTargetName: 'Cases',
        series: [{
            orgUnitId: 'region', orgUnitName: 'Region', targetId: 'cases',
            points: [{ period: '2024W01', periodLabel: 'Week 1', quantiles: { quantile_low: 1, quantile_mid_low: 2, median: 3, quantile_mid_high: 4, quantile_high: 5 } }],
        }],
    }),
}));
vi.mock('@dhis2-chap/ui', async () => ({
    ...await import('../../../../../../../packages/ui/src/utils/outbreakThresholdTiles'),
    DEFAULT_OUTBREAK_PROBABILITY: 75,
    Tag: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@dhis2/ui', () => ({
    Button: () => null, ButtonStrip: () => null, CircularLoader: () => null,
    IconChevronRight16: () => null, IconImportItems24: () => null, NoticeBox: () => null,
    Switch: () => null,
}));
vi.mock('../../../ThresholdTilesExplorer', () => ({
    ThresholdTilesExplorer: vi.fn(({ panel }: { panel: ReactNode }) => panel),
    OutbreakProbabilityControl: () => null,
    ThresholdStrategyControl: () => null,
    ThresholdCalculationStatus: () => null,
    SummaryRow: ({ label, value }: { label: string; value: string | number }) => createElement('div', null, `${label}: ${value}`),
}));

const policy = { id: 3, name: 'Policy', created: null, levels: [{ name: 'Watch', thresholdParams: { type: 'seasonal', stdMultiplier: 3 }, exceedanceThreshold: 0.9 }] };
const alerts = [{ id: 1, alertPolicyId: 3, level: 'Watch', orgUnit: 'region', timePeriod: '2024W01', display: { label: 'Watch', color: 'orange' }, severity: 0 }];
const policyLines = new Map([['region', [{ id: 'policy-3-Watch', label: 'Watch', color: '#ff0000', points: [{ period: '2024W01', value: 10 }] }]]]);
const explorationMap = new Map([['region', [{ period: '2024W01', value: 1 }]]]);
const settings = getDefaultPredictionRunAlertSettings();
const onSettingsChange = vi.fn();

const render = (thresholdsEnabled: boolean, alertsEnabled = true) => {
    const html = renderToStaticMarkup(createElement(PredictionDetailsGrid, {
        model: {} as ModelSpecRead,
        prediction: { id: 7, datasetId: 8, dataset: { periodType: 'Weekly' } } as PredictionInfo,
        settings: { ...settings, thresholdsEnabled, alertsEnabled },
        onImport: vi.fn(), onSettingsChange,
    }));
    const props = vi.mocked(ThresholdTilesExplorer).mock.lastCall![0] as ComponentProps<typeof ThresholdTilesExplorer>;
    return { html, props };
};

describe('prediction policy and exploration views', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useIsFeatureAvailable).mockReturnValue({ isAvailable: true } as ReturnType<typeof useIsFeatureAvailable>);
        vi.mocked(usePredictionAlerts).mockReturnValue({
            displayedAlerts: alerts, status: { kind: 'raised', policies: [policy], alertCount: 1 },
        } as ReturnType<typeof usePredictionAlerts>);
        vi.mocked(useAlertPolicyThresholds).mockReturnValue({ linesByOrgUnit: policyLines } as ReturnType<typeof useAlertPolicyThresholds>);
        vi.mocked(useEndemicThresholds).mockReturnValue({ thresholdMap: explorationMap } as ReturnType<typeof useEndemicThresholds>);
    });

    it('shows policy lines immediately, gives exploration precedence, and restores the policy view', () => {
        const original = structuredClone({ policy, alerts, settings });
        const initial = render(false);
        expect(initial.props).toMatchObject({ raisedAlerts: alerts, policyThresholdLines: policyLines, showThresholds: false });
        expect(vi.mocked(useAlertPolicyThresholds).mock.lastCall![0]).toMatchObject({ policies: [policy], enabled: true });
        expect(initial.html).not.toContain('Regions exceeding threshold:');

        const exploring = render(true);
        expect(exploring.props).toMatchObject({ raisedAlerts: undefined, policyThresholdLines: undefined, showThresholds: true });
        expect(exploring.props.tiles[0].status).toBe('outbreak');
        expect(exploring.html).toContain('Regions exceeding threshold: 1 / 1');
        expect(vi.mocked(useAlertPolicyThresholds).mock.lastCall![0].enabled).toBe(false);

        const restored = render(false);
        expect(restored.props).toMatchObject({ raisedAlerts: alerts, policyThresholdLines: policyLines, showThresholds: false });
        expect(restored.html).not.toContain('Regions exceeding threshold:');
        expect({ policy, alerts, settings }).toEqual(original);
        expect(onSettingsChange).not.toHaveBeenCalled();
    });

    it('hides both policy lines and recorded alerts when alert levels are off', () => {
        expect(render(false, false).props).toMatchObject({ raisedAlerts: undefined, policyThresholdLines: undefined, showThresholds: false });
        expect(vi.mocked(useAlertPolicyThresholds).mock.lastCall![0].enabled).toBe(false);
    });

    it('does not fall back to policy shading while exploratory thresholds are loading or unavailable', () => {
        vi.mocked(useEndemicThresholds).mockReturnValue({ thresholdMap: undefined, isLoading: true } as ReturnType<typeof useEndemicThresholds>);
        expect(render(true).props).toMatchObject({ raisedAlerts: undefined, policyThresholdLines: undefined, showThresholds: false });
    });

    it('keeps policy overlays disabled on backends without alerts', () => {
        vi.mocked(useIsFeatureAvailable).mockReturnValue({ isAvailable: false } as ReturnType<typeof useIsFeatureAvailable>);
        expect(render(false).props).toMatchObject({ raisedAlerts: undefined, policyThresholdLines: undefined });
        expect(vi.mocked(useAlertPolicyThresholds).mock.lastCall![0].enabled).toBe(false);
    });
});
