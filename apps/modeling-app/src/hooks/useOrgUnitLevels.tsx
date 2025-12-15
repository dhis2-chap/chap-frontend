import { useApiDataQuery } from '../utils/useApiDataQuery';

type OrgUnitLevel = {
    id: string;
    name: string;
    level: number;
};

type OrgUnitLevelsResponse = {
    organisationUnitLevels: OrgUnitLevel[];
};

const ORG_UNIT_LEVELS_QUERY = {
    resource: 'organisationUnitLevels',
    params: {
        fields: ['id', 'displayName~rename(name)', 'level'],
        order: 'level:asc',
        paging: false,
    },
};

export const useOrgUnitLevels = () => {
    const { isLoading, error, data } = useApiDataQuery<OrgUnitLevelsResponse>({
        query: ORG_UNIT_LEVELS_QUERY,
        queryKey: ['organisationUnitLevels'],
    });

    return {
        levels: data?.organisationUnitLevels ?? [],
        error,
        isLoading,
    };
};
