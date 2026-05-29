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

const fetchAnalyticsViaAlias = async (
    dataElements: string[],
    periods: string[],
    orgUnits: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<AnalyticsResponse> => {
    const target = buildAnalyticsTargetPath(dataElements, periods, orgUnits);

    const aliasResult = await dataEngine.mutate({
        resource: 'query/alias',
        type: 'create' as const,
        data: { target },
    });

    const alias = aliasResult as Record<string, unknown>;
    const aliasId = alias.id as string | undefined;

    if (!aliasId) {
        throw new Error('Failed to create query alias: no id in response');
    }

    const analyticsResponse = await dataEngine.query({
        response: {
            resource: `query/alias/${aliasId}`,
        },
    });

    return analyticsResponse as AnalyticsResponse;
};

export const fetchAnalytics = async (
    dataElements: string[],
    periods: string[],
    orgUnits: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<AnalyticsResponse> => {
    try {
        return await fetchAnalyticsViaAlias(
            dataElements, periods, orgUnits, dataEngine,
        );
    } catch (error) {
        console.warn(
            'Query alias creation failed, falling back to direct analytics query.',
            'This may fail for large queries that exceed URL length limits.',
            error,
        );
        return await dataEngine.query(
            ANALYTICS_QUERY(dataElements, periods, orgUnits),
        ) as AnalyticsResponse;
    }
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
