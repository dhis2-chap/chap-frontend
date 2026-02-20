import { FeatureCollectionModel } from '@dhis2-chap/ui';
import type { OrgUnitResponse } from './queryUtils';

export const buildOrgUnitFeatureCollection = (
    organisationUnits: OrgUnitResponse['geojson']['organisationUnits'],
): FeatureCollectionModel => ({
    type: 'FeatureCollection',
    features: organisationUnits.map((orgUnit) => {
        const parentId = orgUnit.parent?.id;
        const properties: Record<string, string | number> = {
            id: orgUnit.id,
            level: orgUnit.level,
        };

        if (parentId) {
            properties.parent = parentId;
            properties.parentGraph = parentId;
        }

        return {
            id: orgUnit.id,
            type: 'Feature',
            geometry: orgUnit.geometry,
            properties,
        };
    }),
});
