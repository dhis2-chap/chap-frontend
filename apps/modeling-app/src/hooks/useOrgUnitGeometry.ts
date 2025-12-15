import { parseOrgUnits, FeatureCollection } from '@dhis2-chap/ui';
import { useApiDataQuery } from '../utils/useApiDataQuery';

interface OrganisationUnit {
    id: string;
    ty: number;
    na: string;
    co: string;
}

type OrganisationUnitsResponse = OrganisationUnit[];

export const useOrgUnitGeometry = (orgUnitIds: string[]) => {
    const { data, isLoading, error } = useApiDataQuery<OrganisationUnitsResponse, Error, FeatureCollection>({
        query: {
            resource: 'geoFeatures.json',
            params: {
                ou: 'ou:' + orgUnitIds.join(';'),
            },
        },
        queryKey: ['orgUnitGeometry', orgUnitIds],
        select: data => parseOrgUnits(data),
        enabled: orgUnitIds.length > 0,
    });

    return {
        orgUnits: data,
        loading: isLoading,
        error,
    };
};
