import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { useOrgUnitsById } from './useOrgUnitsById';

type BatchQuery = { params: { filter: string } };

const { queryOrgUnits } = vi.hoisted(() => ({ queryOrgUnits: vi.fn() }));
vi.mock('@dhis2/app-runtime', () => ({
    useDataEngine: () => ({ query: queryOrgUnits }),
}));

const idsInFilter = (query: BatchQuery) => query.params.filter.slice('id:in:['.length, -1).split(',');

it('loads org unit names in batches of at most 200 and returns them sorted by name', async () => {
    const units = Array.from({ length: 401 }, (_, index) => ({
        id: `O${String(index).padStart(10, '0')}`,
        displayName: `Facility ${String(400 - index).padStart(3, '0')}`,
    }));
    const ids = units.map(unit => unit.id);
    queryOrgUnits.mockImplementation(async (queries: Record<string, BatchQuery>) =>
        Object.fromEntries(Object.entries(queries).map(([key, query]) => [key, {
            organisationUnits: units.filter(unit => idsInFilter(query).includes(unit.id)),
        }])),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const OrgUnits = () => {
        useOrgUnitsById(ids);
        return null;
    };
    renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(OrgUnits)));
    // Static rendering registers the query without fetching it.
    const data = await client.getQueryCache().find(['organisationUnits', ids])!.fetch();

    const batches = Object.values(queryOrgUnits.mock.calls[0][0] as Record<string, BatchQuery>).map(idsInFilter);
    expect(batches.map(batch => batch.length)).toEqual([200, 200, 1]);
    expect(data).toEqual({ organisationUnits: [...units].reverse() });
});
