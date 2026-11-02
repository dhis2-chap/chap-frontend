import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BacktestsService, PredictionSetupsService } from '@dhis2-chap/ui';
import type { BacktestRead, PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { fetchPredictionPeriods } from './fetchPredictionPeriods';

vi.mock('@dhis2-chap/ui', () => ({
    BacktestsService: { getBacktestInfoV1CrudBacktestsBacktestIdInfoGet: vi.fn() },
    PredictionSetupsService: { getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet: vi.fn() },
}));

const getSetup = vi.mocked(PredictionSetupsService.getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet);
const getBacktest = vi.mocked(BacktestsService.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet);

// Only the fields read when resolving the forecast horizon are needed here.
const mockSetup = (minPredictionPeriods: number | null, maxPredictionPeriods: number | null) => {
    getSetup.mockResolvedValue({
        backtestId: 42,
        configuredModel: { modelTemplate: { minPredictionPeriods, maxPredictionPeriods } },
    } as PredictionSetupReadWithPredictions);
};

beforeEach(() => {
    vi.resetAllMocks();
    mockSetup(null, null);
    getBacktest.mockResolvedValue({ nPeriods: 6 } as BacktestRead);
});

describe('fetchPredictionPeriods', () => {
    it('reuses the saved evaluation horizon', async () => {
        expect(await fetchPredictionPeriods(7, 'week')).toBe(6);
        expect(getSetup).toHaveBeenCalledWith(7);
        expect(getBacktest).toHaveBeenCalledWith(42);
    });

    it.each([
        { saved: 12, minimum: 1, maximum: 4, expected: 4 },
        { saved: 2, minimum: 4, maximum: null, expected: 4 },
    ])('keeps $saved periods within the model range $minimum–$maximum', async ({ saved, minimum, maximum, expected }) => {
        mockSetup(minimum, maximum);
        getBacktest.mockResolvedValue({ nPeriods: saved } as BacktestRead);
        expect(await fetchPredictionPeriods(7, 'week')).toBe(expected);
    });

    it('falls back to the legacy weekly default when the backtest has no saved horizon', async () => {
        getBacktest.mockResolvedValue({} as BacktestRead);
        expect(await fetchPredictionPeriods(7, 'week')).toBe(12);
    });
});
