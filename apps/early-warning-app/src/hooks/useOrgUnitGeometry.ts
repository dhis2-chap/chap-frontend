import { useDataEngine } from '@dhis2/app-runtime';
import { useQuery } from '@tanstack/react-query';
import { parseOrgUnits } from '@dhis2-chap/ui';

type GeoFeature = { id: string; na: string; ty: number; co: string };
export const useOrgUnitGeometry = (ids: string[]) => {
    const engine = useDataEngine();
    return useQuery({
        queryKey: ['reviewGeometry', ids],
        queryFn: async () => {
            const result = await engine.query({ geometry: {
                resource: 'geoFeatures', params: { ou: `ou:${ids.join(';')}`, displayProperty: 'NAME' },
            } });
            return parseOrgUnits((result.geometry as GeoFeature[]).filter(unit => unit.co));
        },
        enabled: ids.length > 0,
        staleTime: Infinity,
        cacheTime: Infinity,
    });
};
