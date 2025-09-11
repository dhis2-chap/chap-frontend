import { useCallback, useMemo } from 'react';
import { Query, useQueryClient } from '@tanstack/react-query';
import { useApiDataQuery } from '../utils/useApiDataQuery';

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

    const initialData = useMemo(() => {
        const idsSet = new Set(orgUnitIds);

        const cachedOrgUnits = queryClient
            .getQueryCache()
<<<<<<< HEAD
            .findAll({
                queryKey: ['organisationUnits'],
                exact: false,
            })
            .flatMap((query) =>
=======
            .findAll(['organisationUnits'], { exact: false })
            .flatMap(query =>
>>>>>>> origin/main
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

    return useApiDataQuery({
        queryKey: ['organisationUnits', orgUnitIds],
        initialData,
        query: {
            resource: 'organisationUnits',
            params: {
                paging: false,
                fields: ['id', 'displayName', 'path', 'level'],
                filter: `id:in:[${orgUnitIds.join(',')}]`,
                order: 'displayName:asc',
            },
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
