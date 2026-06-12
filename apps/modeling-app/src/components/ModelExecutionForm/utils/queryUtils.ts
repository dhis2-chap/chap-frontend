import { useDataEngine } from '@dhis2/app-runtime';
import { queryWithAliasFallback } from '@/utils/queryAlias';

export type AnalyticsResponse = {
    response: {
        metaData: {
            dimensions: { ou: string[] };
        };
        rows: [string, string, string, string][];
    };
};

export type OrgUnitResponse = {
    geojson: {
        organisationUnits: {
            id: string;
            displayName: string;
            geometry: {
                type: string;
                coordinates: number[][];
            };
            parent?: {
                id: string;
            } | null;
            level: number;
            code?: string;
        }[];
    };
};

export const fetchAnalytics = async (
    dataElements: string[],
    periods: string[],
    orgUnits: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<AnalyticsResponse> => ({
    response: await queryWithAliasFallback<AnalyticsResponse['response']>(dataEngine, {
        resource: 'analytics',
        params: {
            paging: false,
            dimension: `dx:${dataElements.join(';')},ou:${orgUnits.join(';')},pe:${periods.join(';')}`,
            cacheBust: Date.now(),
        },
    }),
});

export const fetchOrgUnits = async (
    orgUnitIds: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<OrgUnitResponse> => ({
    geojson: await queryWithAliasFallback<OrgUnitResponse['geojson']>(dataEngine, {
        resource: 'organisationUnits',
        params: {
            filter: `id:in:[${orgUnitIds.join(',')}]`,
            fields: 'id,geometry,parent[id],level,displayName,code',
            paging: false,
            cacheBust: Date.now(),
        },
    }),
});
