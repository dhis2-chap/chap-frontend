import type { Page } from '@playwright/test';
import type {
    BacktestRead,
    DataBaseResponse,
    DataSource,
    FeatureModel,
    ImportSummaryResponse,
    MakeBacktestWithDataRequest,
} from '@dhis2-chap/ui';
import type {
    AnalyticsResponse,
    OrgUnitResponse,
} from '../../src/components/ModelExecutionForm/utils/queryUtils';

const DHIS2_BASE_URL = process.env.E2E_DHIS2_BASE_URL ?? 'http://localhost:8080';
const EVALUATION_POLL_INTERVAL_MS = 3_000;
const EVALUATION_TIMEOUT_MS = 180_000;
const NAIVE_MODEL_ID = 'naive_model';

const PERIODS = Array.from({ length: 60 }, (_, index) => {
    const year = 2020 + Math.floor(index / 12);
    const month = String((index % 12) + 1).padStart(2, '0');

    return `${year}${month}`;
});

const DATA_SOURCES: DataSource[] = [
    { covariate: 'disease_cases', dataElementId: 'A0Y0q8g6DHw' },
    { covariate: 'rainfall', dataElementId: 'DZte8CXJ6zJ' },
    { covariate: 'mean_temperature', dataElementId: 'Pjd8Rn6mTb0' },
];
const COVARIATE_BY_DATA_ELEMENT_ID = new Map(
    DATA_SOURCES.map(source => [source.dataElementId, source.covariate]),
);

const PROVINCE_ORG_UNIT_IDS = [
    'W6sNfkJcXGC', 'YvLOmtTQD6b', 'XKGgynPS1WZ', 'rO2RVJWHpCe',
    'FRmrFTE63D0', 'MBZYTqkEgwf', 'hdeC7uX9Cko', 'RdNV4tTRNEo',
    'VWGSudnonm5', 'quFXhkOJGB4', 'vBWtCmNNnCG', 'c4HrGRJoarj',
    'pFCZqWnXtoU', 'TOgZ99Jv0bN', 'dOhqCNenSjS', 'sv6c7CpPcrc',
    'hRQsZhmvqgS', 'K27JzTKmBKh',
] as const;

type Dhis2OrgUnit = Omit<
    OrgUnitResponse['geojson']['organisationUnits'][number],
    'geometry'
> & {
    geometry?: FeatureModel['geometry'];
};

export const chapUrl = (path: string) => (
    `${DHIS2_BASE_URL}/api/routes/chap/run${path}`
);

const dhis2Url = (path: string, params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return `${DHIS2_BASE_URL}/api/${path}${queryString}`;
};

type JsonResponse = {
    ok(): boolean;
    status(): number;
    text(): Promise<string>;
    json(): Promise<unknown>;
};

export const readJson = async <T>(response: JsonResponse, action: string): Promise<T> => {
    if (!response.ok()) {
        throw new Error(`${action} failed with ${response.status()}: ${await response.text()}`);
    }

    return await response.json() as T;
};

const getOrgUnitGeoJson = async (page: Page, orgUnitIds: string[]) => {
    const response = await readJson<{ organisationUnits: Dhis2OrgUnit[] }>(
        await page.request.get(dhis2Url('organisationUnits', {
            fields: 'id,geometry,parent[id],level,displayName,code',
            filter: `id:in:[${orgUnitIds.join(',')}]`,
            paging: 'false',
        })),
        'Load province organisation unit geometry',
    );

    return {
        type: 'FeatureCollection',
        features: response.organisationUnits.map(({ id, geometry, parent, level, displayName, code }) => ({
            id,
            type: 'Feature',
            geometry,
            properties: {
                id,
                level,
                displayName,
                ...(code ? { code } : {}),
                ...(parent?.id ? { parent: parent.id, parentGraph: parent.id } : {}),
            },
        })),
    };
};

const pollEvaluationJob = async (page: Page, jobId: string) => {
    const deadline = Date.now() + EVALUATION_TIMEOUT_MS;

    while (Date.now() < deadline) {
        const status = await readJson<string>(
            await page.request.get(chapUrl(`/v1/jobs/${jobId}`)),
            'Poll evaluation job status',
        );

        if (status === 'SUCCESS') {
            return;
        }

        if (status === 'FAILURE' || status === 'REVOKED') {
            const logsResponse = await page.request.get(chapUrl(`/v1/jobs/${jobId}/logs`));
            const logs = logsResponse.ok() ? await logsResponse.text() : '';
            throw new Error(`Evaluation job ${jobId} ended with ${status}.\n${logs}`);
        }

        await page.waitForTimeout(EVALUATION_POLL_INTERVAL_MS);
    }

    throw new Error(`Timed out waiting for evaluation job ${jobId} to complete.`);
};

export const createCompletedNaiveEvaluation = async (
    page: Page,
    name = `E2E naive evaluation ${Date.now()}`,
) => {
    const analytics = await readJson<AnalyticsResponse['response']>(
        await page.request.get(dhis2Url('analytics', {
            paging: 'false',
            dimension: `dx:${DATA_SOURCES.map(source => source.dataElementId).join(';')},ou:${PROVINCE_ORG_UNIT_IDS.join(';')},pe:${PERIODS.join(';')}`,
        })),
        'Load analytics for naive evaluation fixture',
    );

    if (analytics.rows.length === 0) {
        throw new Error('No analytics rows were available for the naive evaluation fixture.');
    }

    const requestBody: MakeBacktestWithDataRequest = {
        name,
        geojson: await getOrgUnitGeoJson(page, analytics.metaData.dimensions.ou),
        providedData: analytics.rows.map(([dataElementId, orgUnit, period, value]) => ({
            featureName: COVARIATE_BY_DATA_ELEMENT_ID.get(dataElementId) ?? null,
            orgUnit,
            period,
            value: Number(value),
        })),
        dataSources: DATA_SOURCES,
        dataToBeFetched: [],
        modelId: NAIVE_MODEL_ID,
        nPeriods: 3,
        nSplits: 10,
        stride: 1,
    };

    const importSummary = await readJson<ImportSummaryResponse>(
        await page.request.post(chapUrl('/v1/analytics/create-backtest-with-data/'), {
            data: requestBody,
            params: {
                dryRun: 'false',
            },
        }),
        'Create naive evaluation',
    );

    if (!importSummary.id) {
        throw new Error('Create naive evaluation did not return a job id.');
    }

    await pollEvaluationJob(page, importSummary.id);

    const { id } = await readJson<DataBaseResponse>(
        await page.request.get(chapUrl(`/v1/jobs/${importSummary.id}/database_result`)),
        'Load created evaluation id',
    );

    return await readJson<BacktestRead>(
        await page.request.get(chapUrl(`/v1/crud/backtests/${id}/info`)),
        'Load created evaluation details',
    );
};
