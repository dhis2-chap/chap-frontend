import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { useDataEngine } from '@dhis2/app-runtime';
import { fetchAnalytics, fetchOrgUnits } from './queryUtils';
import { queryWithAliasFallback } from '@/utils/queryAlias';

vi.mock('@/utils/queryAlias', () => ({ queryWithAliasFallback: vi.fn() }));

const query = vi.fn();
const dataEngine = { query } as unknown as ReturnType<typeof useDataEngine>;
const unitIds = Array.from({ length: 1501 }, (_, index) => `U${String(index).padStart(10, '0')}`);
const analyticsIds = (dimension: string) => dimension.split(',')[1].slice(3).split(';');
const geometryIds = (filter: string) => filter.slice('id:in:['.length, -1).split(',');

beforeEach(() => vi.resetAllMocks());

describe('batched DHIS2 imports', () => {
    it('fetches 1,501 locations sequentially, preserves observations and geometry, and reports progress', async () => {
        let active = 0;
        let maxActive = 0;
        const batchSizes: number[] = [];
        vi.mocked(queryWithAliasFallback).mockImplementation(async (_, { resource, params }) => {
            const ids = resource === 'analytics' ? analyticsIds(String(params.dimension)) : geometryIds(String(params.filter));
            batchSizes.push(ids.length);
            maxActive = Math.max(maxActive, ++active);
            await Promise.resolve();
            active--;
            if (resource === 'analytics') {
                expect(params.dimension).toContain('dx:cases;rain');
                expect(params.dimension).toContain('pe:202401;202402');
                return {
                    metaData: { dimensions: { ou: ids } },
                    rows: ids.flatMap(id => [['cases', id, '202401', '0'], ['rain', id, '202402', '12']]),
                };
            }
            expect(params.fields).toContain('geometry');
            return { organisationUnits: ids.map(id => ({ id, displayName: id, level: 4, geometry: { type: 'Point', coordinates: [1, 2] } })) };
        });
        const onProgress = vi.fn();
        const { response } = await fetchAnalytics(['cases', 'rain'], ['202401', '202402'], [...unitIds, unitIds[0]], dataEngine, onProgress);
        const { geojson } = await fetchOrgUnits(response.metaData.dimensions.ou, dataEngine, onProgress);

        expect(batchSizes).toEqual([200, 200, 200, 200, 200, 200, 200, 101, 200, 200, 200, 200, 200, 200, 200, 101]);
        expect(maxActive).toBe(1);
        expect(response.metaData.dimensions.ou).toEqual(unitIds);
        expect(response.rows).toEqual(unitIds.flatMap(id => [['cases', id, '202401', '0'], ['rain', id, '202402', '12']]));
        expect(geojson.organisationUnits.map(unit => unit.id)).toEqual(unitIds);
        expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('1401–1501 of 1501'));
        expect(query).not.toHaveBeenCalled();
    });

    it('resolves paged levels and groups within selected subtrees before requesting analytics', async () => {
        query.mockImplementation(async ({ level, units }) => {
            if (level) {
                expect(level.resource).toBe('organisationUnitLevels/levelUid123');
                return { level: { level: 4 } };
            }
            expect(units.params.pageSize).toBe(200);
            expect(units.params.paging).toBe(true);
            const ids = units.params.filter ? [unitIds[0], unitIds[201]] : unitIds.slice((units.params.page - 1) * 200, units.params.page * 200).slice(0, units.params.page === 1 ? 200 : 1);
            return {
                units: {
                    pager: { pageCount: units.params.filter ? 1 : 2 },
                    organisationUnits: ids.map((id: string) => ({ id, path: `/root/${id === unitIds[1] ? 'outside' : 'boundary'}/${id}` })),
                },
            };
        });
        vi.mocked(queryWithAliasFallback).mockImplementation(async (_, { params }) => ({
            metaData: { dimensions: { ou: analyticsIds(String(params.dimension)) } }, rows: [],
        }));

        const { response } = await fetchAnalytics(['cases'], ['202401'], ['boundary', 'LEVEL-levelUid123', 'LEVEL-4', 'OU_GROUP-groupUid123'], dataEngine);

        expect(response.metaData.dimensions.ou).toEqual(unitIds.slice(0, 202).filter(id => id !== unitIds[1]));
        expect(query.mock.calls.filter(([request]) => request.level)).toHaveLength(1);
        expect(query.mock.calls.filter(([request]) => request.units?.params.level === 4)).toHaveLength(4);
        expect(query.mock.calls.at(-1)?.[0].units.params.filter).toBe('organisationUnitGroups.id:eq:groupUid123');
        expect(queryWithAliasFallback).toHaveBeenCalledTimes(2);
        for (const [, { params }] of vi.mocked(queryWithAliasFallback).mock.calls) {
            expect(analyticsIds(String(params.dimension)).length).toBeLessThanOrEqual(200);
            expect(params.dimension).not.toMatch(/LEVEL-|OU_GROUP-|boundary/);
        }
    });

    it('does not issue an unbounded request when no locations are selected or resolved', async () => {
        query.mockResolvedValue({ units: { organisationUnits: [] } });
        expect((await fetchAnalytics(['cases'], ['202401'], ['LEVEL-4'], dataEngine)).response.rows).toEqual([]);
        expect((await fetchAnalytics(['cases'], ['202401'], [], dataEngine)).response.rows).toEqual([]);
        expect((await fetchOrgUnits([], dataEngine)).geojson.organisationUnits).toEqual([]);
        expect(queryWithAliasFallback).not.toHaveBeenCalled();
    });

    it.each(['analytics', 'geometry'])('stops on a failed %s batch without returning partial data', async (resource) => {
        vi.mocked(queryWithAliasFallback)
            .mockResolvedValueOnce({ metaData: { dimensions: { ou: unitIds.slice(0, 200) } }, rows: [], organisationUnits: [] })
            .mockRejectedValueOnce(new Error('Server unavailable'));
        const request = resource === 'analytics'
            ? fetchAnalytics(['cases'], ['202401'], unitIds, dataEngine)
            : fetchOrgUnits(unitIds, dataEngine);
        await expect(request).rejects.toThrow('Server unavailable');
        expect(queryWithAliasFallback).toHaveBeenCalledTimes(2);
    });
});
