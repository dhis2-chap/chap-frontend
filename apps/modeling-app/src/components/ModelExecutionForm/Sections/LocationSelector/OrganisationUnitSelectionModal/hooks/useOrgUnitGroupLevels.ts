import { useMemo } from 'react';
import { useApiDataQuery } from '../../../../../../utils/useApiDataQuery';

type OrgUnitGroupWithLevels = {
    id: string;
    displayName: string;
    organisationUnits: Array<{
        id: string;
        level: number;
    }>;
};

type OrgUnitGroupsResponse = {
    organisationUnitGroups: OrgUnitGroupWithLevels[];
};

export const useOrgUnitGroupLevels = (groupIds: string[]) => {
    const sortedGroupIds = useMemo(() => [...groupIds].sort(), [groupIds]);

    const { data, isLoading, error } = useApiDataQuery<OrgUnitGroupsResponse>({
        query: {
            resource: 'organisationUnitGroups',
            params: {
                fields: ['id', 'displayName', 'organisationUnits[id,level]'],
                filter: `id:in:[${sortedGroupIds.join(',')}]`,
                paging: false,
            },
        },
        queryKey: ['organisationUnitGroups', 'levels', sortedGroupIds],
        staleTime: 300000,
        cacheTime: 300000,
        retry: 0,
        enabled: sortedGroupIds.length > 0,
    });

    return {
        groups: data?.organisationUnitGroups ?? [],
        isLoading: sortedGroupIds.length > 0 && isLoading,
        error,
    };
};
