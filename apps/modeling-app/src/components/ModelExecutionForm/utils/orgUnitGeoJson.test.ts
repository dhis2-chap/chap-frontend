import { describe, expect, it } from 'vitest';
import { buildOrgUnitFeatureCollection } from './orgUnitGeoJson';
import type { OrgUnitResponse } from './queryUtils';

describe('buildOrgUnitFeatureCollection', () => {
    it('omits parent fields when parent is missing', () => {
        const organisationUnits: OrgUnitResponse['geojson']['organisationUnits'] = [
            {
                id: 'root-ou',
                displayName: 'Country',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[0, 0]],
                },
                parent: null,
                level: 1,
            },
        ];

        const featureCollection = buildOrgUnitFeatureCollection(organisationUnits);

        expect(featureCollection.features[0].properties).toEqual({
            id: 'root-ou',
            level: 1,
        });
    });

    it('uses parent id when parent exists', () => {
        const organisationUnits: OrgUnitResponse['geojson']['organisationUnits'] = [
            {
                id: 'child-ou',
                displayName: 'District',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[1, 1]],
                },
                parent: {
                    id: 'root-ou',
                },
                level: 2,
            },
        ];

        const featureCollection = buildOrgUnitFeatureCollection(organisationUnits);

        expect(featureCollection.features[0].properties).toMatchObject({
            id: 'child-ou',
            parent: 'root-ou',
            parentGraph: 'root-ou',
            level: 2,
        });
    });
});
