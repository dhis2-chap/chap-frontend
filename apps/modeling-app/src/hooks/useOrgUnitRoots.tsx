import { useApiDataQuery } from '../utils/useApiDataQuery';

type OrgUnitRoot = {
    id: string;
    name: string;
    path: string;
};

type OrgUnitRootsResponse = {
    organisationUnits: OrgUnitRoot[];
};

// Fetches the root org units associated with the current user with fallback to data capture org units
const ORG_UNIT_ROOTS_QUERY = {
    resource: 'organisationUnits',
    params: {
        fields: ['id', 'displayName~rename(name)', 'path'],
        userDataViewFallback: true,
    },
};

export const useOrgUnitRoots = () => {
    const { isLoading, error, data } = useApiDataQuery<OrgUnitRootsResponse>({
        query: ORG_UNIT_ROOTS_QUERY,
        queryKey: ['organisationUnitRoots'],
    });

    return {
        roots: data?.organisationUnits ?? [],
        error,
        isLoading,
    };
};
