import { useState } from 'react'
import { useDataQuery } from '@dhis2/app-runtime'
import { parseOrgUnits } from '../components/maps/utils'

interface OrganisationUnit {
    id: string // Unique identifier of the organisation unit
    ty: number // Type of organisation unit
    na: string // Name
    co: string // Encoded geometry as a string (needs to be parsed if used)
}

type OrganisationUnits = {
    orgUnits: OrganisationUnit[]
}

const REQUEST = {
    orgUnits: {
        resource: 'geoFeatures.json',
        params: ({ orgUnits }: { orgUnits: string[] }) => ({
            ou: 'ou:' + orgUnits.join(';'),
        }),
    },
} as any

const useOrgUnits = (orgUnitIds: any) => {
    const [orgUnits, setOrgunits] = useState<{ GeoJson: any }>() as any

    const { loading, error } = useDataQuery<OrganisationUnits>(REQUEST, {
        variables: { orgUnits: orgUnitIds },
        onComplete: (data: any) => setOrgunits(parseOrgUnits(data.orgUnits)),
    })

    return {
        orgUnits,
        error,
        loading,
    }
}

export default useOrgUnits
