import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BacktestsService, PredictionSetupsService } from '@dhis2-chap/ui';
import type { BacktestRead, PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { fetchPredictionPeriods } from './fetchPredictionPeriods';

vi.mock('@dhis2-chap/ui', () => ({
    BacktestsService: { getBacktestInfoV1CrudBacktestsBacktestIdInfoGet: vi.fn() },
    PredictionSetupsService: { getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet: vi.fn() },
}));

// Only the fields read when resolving the forecast horizon are needed here.
const setup = {
    id: 7,
    backtestId: 42,
    configuredModel: { modelTemplate: { minPredictionPeriods: 1, maxPredictionPeriods: 4 } },
} as PredictionSetupReadWithPredictions;
const backtest = { id: 42, nPeriods: 4 } as BacktestRead;

const getSetup = vi.mocked(PredictionSetupsService.getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet);
const getBacktest = vi.mocked(BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet);

beforeEach(() => {
    vi.resetAllMocks();
    getSetup.mockResolvedValue(setup);
    getBacktest.mockResolvedValue(backtest);
});

describe('prediction forecast horizon', () => {
    it('reuses the associated evaluation’s four-week horizon instead of requesting twelve weeks', async () => {
        expect(await fetchPredictionPeriods(7, 'WEEK')).toBe(4);
        expect(getSetup).toHaveBeenCalledWith(7);
        expect(getBacktest).toHaveBeenCalledWith(42);
    });

    it.each(['WEEK', 'MONTH'])('preserves a saved horizon for %s data when the model has no limits', async (periodType) => {
        getSetup.mockResolvedValue({ ...setup, configuredModel: { ...setup.configuredModel, modelTemplate: { name: 'model', version: '1' } } });
        getBacktest.mockResolvedValue({ ...backtest, nPeriods: 6 });
        expect(await fetchPredictionPeriods(7, periodType)).toBe(6);
    });

    it.each([
        { saved: 12, minimum: 1, maximum: 4, expected: 4 },
        { saved: 2, minimum: 4, maximum: 12, expected: 4 },
        { saved: 3, minimum: 4, maximum: 4, expected: 4 },
    ])('keeps $saved periods within the model range $minimum–$maximum', async ({ saved, minimum, maximum, expected }) => {
        getBacktest.mockResolvedValue({ ...backtest, nPeriods: saved });
        getSetup.mockResolvedValue({
            ...setup,
            configuredModel: {
                ...setup.configuredModel,
                modelTemplate: { ...setup.configuredModel.modelTemplate, minPredictionPeriods: minimum, maxPredictionPeriods: maximum },
            },
        });
        expect(await fetchPredictionPeriods(7, 'WEEK')).toBe(expected);
    });

    it.each([
        { periodType: 'week', maximum: null, expected: 12 },
        { periodType: 'month', maximum: null, expected: 3 },
        { periodType: 'week', maximum: 4, expected: 4 },
    ])('bounds the legacy $periodType fallback by $maximum', async ({ periodType, maximum, expected }) => {
        getBacktest.mockResolvedValue({ ...backtest, nPeriods: undefined });
        getSetup.mockResolvedValue({
            ...setup,
            configuredModel: {
                ...setup.configuredModel,
                modelTemplate: { ...setup.configuredModel.modelTemplate, maxPredictionPeriods: maximum },
            },
        });
        expect(await fetchPredictionPeriods(7, periodType)).toBe(expected);
    });

    it('does not replace a failed backtest lookup with the twelve-week fallback', async () => {
        getBacktest.mockRejectedValue(new Error('Evaluation unavailable'));
        await expect(fetchPredictionPeriods(7, 'WEEK')).rejects.toThrow('Evaluation unavailable');
    });

    it.each([0, -1, 1.5, NaN])('rejects an invalid saved horizon of %s', async (nPeriods) => {
        getBacktest.mockResolvedValue({ ...backtest, nPeriods });
        await expect(fetchPredictionPeriods(7, 'WEEK')).rejects.toThrow('Cannot determine a supported forecast horizon');
    });
});
