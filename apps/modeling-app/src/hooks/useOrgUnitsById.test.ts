import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { useOrgUnitsById } from './useOrgUnitsById';

const { queryOrgUnits } = vi.hoisted(() => ({ queryOrgUnits: vi.fn() }));
vi.mock('@dhis2/app-runtime', () => ({
    useDataEngine: () => ({ query: queryOrgUnits }),
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: Infinity } } });

afterEach(() => {
    client.clear();
    vi.resetAllMocks();
});

const renderOrgUnits = (ids: string[]) => {
    let result: ReturnType<typeof useOrgUnitsById>;
    const OrgUnits = () => {
        result = useOrgUnitsById(ids);
        return null;
    };
    renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(OrgUnits)));
    return result!;
};

const fetchOrgUnits = (ids: string[]) => {
    renderOrgUnits(ids);
    // Static rendering registers the real query; fetch it explicitly without a browser.
    return client.getQueryCache().find(['organisationUnits', ids])!.fetch();
};

it('loads 601 org unit names in batches of at most 200 and merges them in name order', async () => {
    const units = Array.from({ length: 601 }, (_, index) => ({
        id: `O${String(index).padStart(10, '0')}`,
        displayName: `Facility ${String(600 - index).padStart(3, '0')}`,
    }));
    const ids = units.map(unit => unit.id);
    queryOrgUnits.mockImplementation(async ({ apiDataQuery }) => {
        const batchIds = apiDataQuery.params.filter.slice('id:in:['.length, -1).split(',');
        expect(batchIds.length).toBeLessThanOrEqual(200);
        expect(apiDataQuery.resource).toBe('organisationUnits');
        expect(apiDataQuery.params.paging).toBe(false);
        return {
            apiDataQuery: {
                organisationUnits: units
                    .filter(unit => batchIds.includes(unit.id))
                    .sort((a, b) => a.displayName.localeCompare(b.displayName)),
            },
        };
    });

    await fetchOrgUnits(ids);

    expect(queryOrgUnits).toHaveBeenCalledTimes(4);
    expect(queryOrgUnits.mock.calls.flatMap(([query]) =>
        query.apiDataQuery.params.filter.slice('id:in:['.length, -1).split(','),
    )).toEqual(ids);
    expect(renderOrgUnits(ids).data?.organisationUnits).toEqual([...units].reverse());
});

it('keeps the ID fallback for missing names and reuses cached names for a subset', async () => {
    const unit = { id: 'O0000000001', displayName: 'Facility' };
    const missingId = 'O0000000002';
    queryOrgUnits.mockResolvedValue({ apiDataQuery: { organisationUnits: [unit] } });

    await fetchOrgUnits([unit.id, missingId]);

    expect(renderOrgUnits([unit.id, missingId]).data?.organisationUnits).toEqual([
        unit,
        { id: missingId, displayName: missingId },
    ]);
    const subset = renderOrgUnits([unit.id]);
    expect(subset.data?.organisationUnits).toEqual([unit]);
    expect(subset.isStale).toBe(false);
    expect(queryOrgUnits).toHaveBeenCalledTimes(1);
});

it('reports a failed batch without exposing partial results as a successful lookup', async () => {
    const ids = Array.from({ length: 201 }, (_, index) => `O${String(index).padStart(10, '0')}`);
    const error = new Error('Org unit request failed');
    queryOrgUnits
        .mockResolvedValueOnce({ apiDataQuery: { organisationUnits: [{ id: ids[0], displayName: 'Facility' }] } })
        .mockRejectedValueOnce(error);

    await expect(fetchOrgUnits(ids)).rejects.toThrow(error);

    const result = renderOrgUnits(ids);
    expect(result.error).toBe(error);
    expect(result.data).toBeUndefined();
});
