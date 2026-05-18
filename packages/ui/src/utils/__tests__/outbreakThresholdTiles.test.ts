import { describe, expect, it } from 'vitest';
import type { PredictionOrgUnitSeries, PredictionPointVM } from '../../interfaces/Prediction';
import {
    getStableMaxYForThresholdChart,
    getThresholdTileViewModels,
} from '../outbreakThresholdTiles';

const point = (
    period: string,
    quantiles: PredictionPointVM['quantiles'],
): PredictionPointVM => ({
    period,
    periodLabel: period,
    quantiles,
});

const noOutbreakQuantiles: PredictionPointVM['quantiles'] = {
    quantile_low: 5,
    quantile_mid_low: 5,
    median: 5,
    quantile_mid_high: 5,
    quantile_high: 5,
};

const outbreakQuantiles = (highQuantile: number): PredictionPointVM['quantiles'] => ({
    quantile_low: 10,
    quantile_mid_low: 18,
    median: 24,
    quantile_mid_high: 30,
    quantile_high: highQuantile,
});

const series = ({
    actualValues = [10, 12, 14, 16],
    highQuantile = 5,
    id,
    name,
}: {
    actualValues?: Array<number | null>;
    highQuantile?: number;
    id: string;
    name: string;
}): PredictionOrgUnitSeries => ({
    targetId: 'cases',
    orgUnitId: id,
    orgUnitName: name,
    actualCases: actualValues.map((value, index) => ({
        period: `20230${index + 1}`,
        value,
    })),
    points: [
        point(
            '202401',
            highQuantile <= 5
                ? noOutbreakQuantiles
                : outbreakQuantiles(highQuantile),
        ),
    ],
});

describe('getThresholdTileViewModels', () => {
    it('preserves the incoming region order regardless of outbreak status', () => {
        const { tiles } = getThresholdTileViewModels([
            series({ id: 'no-outbreak', name: 'Beta', highQuantile: 5 }),
            series({ id: 'unavailable', name: 'Charlie', actualValues: [10, null, null, 16] }),
            series({ id: 'outbreak', name: 'Alpha', highQuantile: 50 }),
        ], 75);

        expect(tiles.map(viewModel => viewModel.orgUnitId)).toEqual([
            'no-outbreak',
            'unavailable',
            'outbreak',
        ]);
    });

    it('does not sort alphabetically within status groups', () => {
        const { tiles } = getThresholdTileViewModels([
            series({ id: 'zulu-outbreak', name: 'Zulu', highQuantile: 50 }),
            series({ id: 'alpha-outbreak', name: 'Alpha', highQuantile: 50 }),
            series({ id: 'beta-unavailable', name: 'Beta', actualValues: [10] }),
            series({ id: 'alpha-unavailable', name: 'Alpha', actualValues: [10] }),
        ], 75);

        expect(tiles.map(viewModel => viewModel.orgUnitId)).toEqual([
            'zulu-outbreak',
            'alpha-outbreak',
            'beta-unavailable',
            'alpha-unavailable',
        ]);
    });

    it('updates status when the selected probability changes', () => {
        const candidate = series({ id: 'region-a', name: 'Region A', highQuantile: 50 });

        expect(getThresholdTileViewModels([candidate], 10).tiles[0].status).toBe('outbreak');
        expect(getThresholdTileViewModels([candidate], 90).tiles[0].status).toBe('noOutbreak');
    });

    it('returns summary counts for the selected probability', () => {
        const { summary } = getThresholdTileViewModels([
            series({ id: 'outbreak-a', name: 'Outbreak A', highQuantile: 50 }),
            series({ id: 'outbreak-b', name: 'Outbreak B', highQuantile: 50 }),
            series({ id: 'unavailable', name: 'Unavailable', actualValues: [10] }),
            series({ id: 'quiet', name: 'Quiet', highQuantile: 5 }),
        ], 75);

        expect(summary).toEqual({
            alertPeriods: 2,
            regionsWithAlerts: 2,
            totalRegions: 4,
            unavailableThresholds: 1,
        });
    });

    it('sets a stable y-axis max from the full series and endemic threshold', () => {
        const candidate = series({
            id: 'region-a',
            name: 'Region A',
            actualValues: [100, 100, 100, 100],
            highQuantile: 50,
        });

        expect(getStableMaxYForThresholdChart(candidate, 120)).toBe(126);
    });
});
