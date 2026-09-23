import { describe, expect, it } from 'vitest';
import { inspectDataset } from './inspectDataset';
import type { PreparedDataset } from './prepareDataset';

type Row = [featureName: string, orgUnit: string, period: string, value: number | null];

const prepared = (rows: Row[], orgUnits: PreparedDataset['orgUnits']): PreparedDataset => ({
    request: {
        name: 'Data',
        geojson: { type: 'FeatureCollection', features: [] },
        dataToBeFetched: [],
        providedData: rows.map(([featureName, orgUnit, period, value]) => ({ featureName, orgUnit, period, value })),
    },
    periods: ['202401', '202402', '202403'],
    orgUnits,
});

const unit = (id: string, hasGeometry = true) => ({ id, displayName: id, hasGeometry });

describe('inspectDataset', () => {
    it('accepts complete locations and tolerates gaps in the target', () => {
        const summary = inspectDataset(prepared([
            ['disease_cases', 'a', '202401', 1],
            ['rainfall', 'a', '202401', 2],
            ['rainfall', 'a', '202402', 3],
        ], [unit('a')]));

        expect(summary).toEqual({ id: null, importedCount: 1, rejected: [] });
    });

    it('rejects covariate gaps within the span the data covers', () => {
        const summary = inspectDataset(prepared([
            ['rainfall', 'a', '202401', 2],
            ['rainfall', 'a', '202402', null],
            ['rainfall', 'b', '202401', 2],
            ['rainfall', 'b', '202402', 3],
        ], [unit('a'), unit('b')]));

        expect(summary.importedCount).toBe(1);
        expect(summary.rejected).toEqual([
            expect.objectContaining({ featureName: 'rainfall', orgUnit: 'a', timePeriods: ['202402'] }),
        ]);
    });

    it('only rejects population when it is missing entirely, as CHAP interpolates it', () => {
        const summary = inspectDataset(prepared([
            ['population', 'a', '202401', 100],
            ['population', 'a', '202403', 110],
            ['population', 'b', '202401', null],
            ['disease_cases', 'b', '202403', 1],
        ], [unit('a'), unit('b')]));

        expect(summary.importedCount).toBe(1);
        expect(summary.rejected).toEqual([
            expect.objectContaining({ featureName: 'population', orgUnit: 'b' }),
        ]);
    });

    it('rejects locations with no data or no polygon', () => {
        const summary = inspectDataset(prepared([
            ['rainfall', 'a', '202401', 1],
            ['rainfall', 'shapeless', '202401', 1],
        ], [unit('a'), unit('empty'), unit('shapeless', false)]));

        expect(summary.importedCount).toBe(1);
        expect(summary.rejected.map(item => [item.orgUnit, item.featureName])).toEqual([
            ['empty', 'All columns'],
            ['shapeless', 'polygon'],
        ]);
    });
});
