import { useDataEngine } from '@dhis2/app-runtime';
import { queryViaAlias } from '@/utils/queryAlias';

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
    return {
        response: await queryViaAlias<AnalyticsResponse['response']>(dataEngine, target),
    };
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

const buildOrgUnitsTargetPath = (orgUnitIds: string[]): string => {
    const params = new URLSearchParams({
        filter: `id:in:[${orgUnitIds.join(',')}]`,
        fields: 'id,geometry,parent[id],level,displayName,code',
        paging: 'false',
    });

    return `/api/organisationUnits?${params.toString()}`;
};

const fetchOrgUnitsViaAlias = async (
    orgUnitIds: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<OrgUnitResponse> => {
    const target = buildOrgUnitsTargetPath(orgUnitIds);
    return {
        geojson: await queryViaAlias<OrgUnitResponse['geojson']>(dataEngine, target),
    };
};

export const fetchOrgUnits = async (
    orgUnitIds: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
): Promise<OrgUnitResponse> => {
    try {
        return await fetchOrgUnitsViaAlias(orgUnitIds, dataEngine);
    } catch (error) {
        console.warn(
            'Query alias creation failed, falling back to direct organisation unit query.',
            'This may fail for large queries that exceed URL length limits.',
            error,
        );
        return await dataEngine.query(
            ORG_UNITS_QUERY(orgUnitIds),
        ) as OrgUnitResponse;
    }
};
