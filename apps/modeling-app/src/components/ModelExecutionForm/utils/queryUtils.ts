import { useDataEngine } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import { queryWithAliasFallback } from '@/utils/queryAlias';
import { ORG_UNIT_BATCH_SIZE, resolveOrgUnits } from './resolveOrgUnits';

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
    onProgress?: (message: string) => void,
): Promise<AnalyticsResponse> => {
    const ids = await resolveOrgUnits(orgUnits, dataEngine, onProgress);
    const response: AnalyticsResponse['response'] = { metaData: { dimensions: { ou: [] } }, rows: [] };
    // Sequential batches bound both response size and server load.
    for (let start = 0; start < ids.length; start += ORG_UNIT_BATCH_SIZE) {
        onProgress?.(i18n.t('Fetching data for locations {{start}}–{{end}} of {{total}}', {
            start: start + 1, end: Math.min(start + ORG_UNIT_BATCH_SIZE, ids.length), total: ids.length,
        }));
        const batch = await queryWithAliasFallback<AnalyticsResponse['response']>(dataEngine, {
            resource: 'analytics',
            params: {
                paging: false,
                dimension: `dx:${dataElements.join(';')},ou:${ids.slice(start, start + ORG_UNIT_BATCH_SIZE).join(';')},pe:${periods.join(';')}`,
                cacheBust: Date.now(),
            },
        });
        // Avoid spreading potentially large observation arrays into function arguments.
        for (const row of batch.rows) response.rows.push(row);
        response.metaData.dimensions.ou.push(...batch.metaData.dimensions.ou);
    }
    response.metaData.dimensions.ou = [...new Set(response.metaData.dimensions.ou)];
    return { response };
};

export const fetchOrgUnits = async (
    orgUnitIds: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
    onProgress?: (message: string) => void,
): Promise<OrgUnitResponse> => {
    const ids = [...new Set(orgUnitIds)];
    const organisationUnits: OrgUnitResponse['geojson']['organisationUnits'] = [];
    for (let start = 0; start < ids.length; start += ORG_UNIT_BATCH_SIZE) {
        onProgress?.(i18n.t('Fetching geometry for locations {{start}}–{{end}} of {{total}}', {
            start: start + 1, end: Math.min(start + ORG_UNIT_BATCH_SIZE, ids.length), total: ids.length,
        }));
        const batch = await queryWithAliasFallback<OrgUnitResponse['geojson']>(dataEngine, {
            resource: 'organisationUnits',
            params: {
                filter: `id:in:[${ids.slice(start, start + ORG_UNIT_BATCH_SIZE).join(',')}]`,
                fields: 'id,geometry,parent[id],level,displayName,code',
                paging: false,
                cacheBust: Date.now(),
            },
        });
        organisationUnits.push(...batch.organisationUnits);
    }
    return { geojson: { organisationUnits } };
};
