import { useCallback, useMemo } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';
import { Query, useQuery, useQueryClient } from '@tanstack/react-query';

const ORG_UNIT_BATCH_SIZE = 200;

type OrganisationUnit = {
    id: string;
    displayName: string;
};

type OrgUnitResult = {
    organisationUnits: OrganisationUnit[];
};

const isOrgUnitResult = (data: any): data is OrgUnitResult => {
    return data && Array.isArray(data.organisationUnits);
};
const isOrgUnitQuery = (query: Query<any>): query is Query<OrgUnitResult> => {
    return !!query.state.data && isOrgUnitResult(query.state.data);
};

export const useOrgUnitsById = (orgUnitIds: string[]) => {
    const queryClient = useQueryClient();
    const dataEngine = useDataEngine();

    const initialData = useMemo(() => {
        const idsSet = new Set(orgUnitIds);

        const cachedOrgUnits = queryClient
            .getQueryCache()
            .findAll({
                queryKey: ['organisationUnits'],
                exact: false,
            })
            .flatMap(query =>
                isOrgUnitQuery(query)
                    ? query.state.data?.organisationUnits ?? []
                    : [],
            )
            .filter(ou => idsSet.has(ou.id));

        if (cachedOrgUnits.length === 0) {
            return undefined;
        }
        // remove duplicates
        const cachedMap = new Map(cachedOrgUnits.map(ou => [ou.id, ou]));

        const hasAllOrgUnits = orgUnitIds.every(id => cachedMap.has(id));

        return hasAllOrgUnits
            ? { organisationUnits: Array.from(cachedMap.values()) }
            : undefined;
    }, [orgUnitIds, queryClient]);

    return useQuery<OrgUnitResult, Error>({
        queryKey: ['organisationUnits', orgUnitIds],
        initialData,
        queryFn: async () => {
            // Keep each request below the server's request-line length limit.
            const batches: string[][] = [];
            for (let start = 0; start < orgUnitIds.length; start += ORG_UNIT_BATCH_SIZE) {
                batches.push(orgUnitIds.slice(start, start + ORG_UNIT_BATCH_SIZE));
            }
            // The data engine runs the batch queries in parallel.
            const response = await dataEngine.query(Object.fromEntries(batches.map((ids, index) => [index, {
                resource: 'organisationUnits',
                params: {
                    paging: false,
                    fields: ['id', 'displayName'],
                    filter: `id:in:[${ids.join(',')}]`,
                },
            }])));
            return {
                organisationUnits: Object.values(response)
                    .flatMap(result => (result as OrgUnitResult).organisationUnits)
                    .sort((a, b) => a.displayName.localeCompare(b.displayName)),
            };
        },
        enabled: orgUnitIds.length > 0,
        select: useCallback(
            (data: OrgUnitResult) => {
                // some orgUnits were not found (eg data in Chap not in DHIS2)
                // fallback to id...
                if (data.organisationUnits.length !== orgUnitIds.length) {
                    const fetchedOrgUnitIdsSet = new Set(
                        data.organisationUnits.map(ou => ou.id),
                    );
                    const missingUnits = orgUnitIds
                        .filter(id => !fetchedOrgUnitIdsSet.has(id))
                        .map(id => ({
                            id,
                            displayName: id, // fallback to id as displayName
                        }));
                    return {
                        organisationUnits:
                            data.organisationUnits.concat(missingUnits),
                    };
                }
                return data;
            },
            [orgUnitIds],
        ),
        cacheTime: Infinity,
        staleTime: Infinity,
    });
};
