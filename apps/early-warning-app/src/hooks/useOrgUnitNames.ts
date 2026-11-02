import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';

type OrgUnitsResponse = { orgUnits: { organisationUnits: { id: string; displayName: string }[] } };

/** Display names by id; ids missing in DHIS2 are left out, so callers fall back to the id. */
export const useOrgUnitNames = (ids: string[]) => {
    const engine = useDataEngine();
    const uniqueIds = [...new Set(ids)].sort();
    const { data } = useQuery({
        queryKey: ['organisationUnits', uniqueIds],
        queryFn: async () => {
            const response = await engine.query({
                orgUnits: {
                    resource: 'organisationUnits',
                    params: { paging: false, fields: ['id', 'displayName'], filter: `id:in:[${uniqueIds.join(',')}]` },
                },
            }) as unknown as OrgUnitsResponse;
            return new Map(response.orgUnits.organisationUnits.map(orgUnit => [orgUnit.id, orgUnit.displayName]));
        },
        enabled: uniqueIds.length > 0,
        staleTime: Infinity,
    });
    return data ?? new Map<string, string>();
};
