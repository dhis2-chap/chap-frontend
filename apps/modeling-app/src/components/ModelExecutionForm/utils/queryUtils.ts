import { useDataEngine } from '@dhis2/app-runtime';

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

export const ANALYTICS_QUERY = (dataElements: string[], periods: string[], orgUnits: string[]) => ({
    response: {
        resource: 'analytics',
        params: {
            paging: false,
            dimension: `dx:${dataElements.join(';')},ou:${orgUnits.join(';')},pe:${periods.join(';')}`,
        },
    },
});

const buildAnalyticsTargetPath = (
    dataElements: string[],
    periods: string[],
    orgUnits: string[],
): string => {
    const dimension = `dx:${dataElements.join(';')},ou:${orgUnits.join(';')},pe:${periods.join(';')}`;
    return `/api/analytics?paging=false&dimension=${dimension}`;
};

export const fetchAnalyticsViaAlias = async (
    dataElements: string[],
    periods: string[],
    orgUnits: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<AnalyticsResponse> => {
    const target = buildAnalyticsTargetPath(dataElements, periods, orgUnits);

    const aliasResponse = await dataEngine.mutate({
        resource: 'query/alias',
        type: 'create' as const,
        data: { target },
    }) as unknown as { id: string };

    const analyticsResponse = await dataEngine.query({
        response: {
            resource: `query/alias/${aliasResponse.id}`,
        },
    });

    return analyticsResponse as AnalyticsResponse;
};

export const ORG_UNITS_QUERY = (orgUnitIds: string[]) => ({
    geojson: {
        resource: 'organisationUnits',
        params: {
            filter: `id:in:[${orgUnitIds.join(',')}]`,
            fields: 'id,geometry,parent[id],level,displayName,code',
            paging: false,
        },
    },
});
