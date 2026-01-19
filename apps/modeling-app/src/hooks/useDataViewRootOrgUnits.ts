import { useApiDataQuery } from '../utils/useApiDataQuery'

const DataViewRootOrgUnitsRequest = {
    resource: 'organisationUnits',
    params: {
        userDataViewFallback: true,
        fields: 'id',
    },
}

export type OrgUnit = {
    id: string
}

export type DataViewRootOrgUnitsResponse = {
    organisationUnits: OrgUnit[]
}

export const useDataViewRootOrgUnits = () => {
    const { data, error, isLoading, isError } = useApiDataQuery<
        DataViewRootOrgUnitsResponse,
        Error,
        OrgUnit[]
    >({
        queryKey: ['organisationUnits', 'dataViewRoot'],
        query: DataViewRootOrgUnitsRequest,
        select: (data) => data.organisationUnits,
    })

    return {
        orgUnits: data,
        error,
        isLoading,
        isError,
    }
}
