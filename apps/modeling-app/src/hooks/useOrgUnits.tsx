import { useState } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';

type OrganisationUnit = {
    id: string;
    displayName: string;
};

const REQUEST = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
            fields: ['id', 'displayName'],
        },
    },
};

const useOrgUnits = () => {
    const [orgUnits, setOrgunits] = useState<{ organisationUnits: OrganisationUnit[] }>();

    const { loading, error } = useDataQuery(REQUEST, {
        onComplete: (data: any) => setOrgunits(data.orgUnits),
    });

    return {
        orgUnits,
        error,
        loading,
    };
};

export default useOrgUnits;
