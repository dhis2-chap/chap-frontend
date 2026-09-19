import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { ModelSpecRead } from '@dhis2-chap/ui';
import type {
    CovariateMapping,
    ModelExecutionFormValues,
} from '../hooks/useModelExecutionFormState';
import type { Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import {
    buildDataItems,
    buildDataSources,
    calculatePeriods,
    convertDhis2AnalyticsToChap,
    prepareBacktestData,
} from './prepareBacktestData';
import { generateBacktestDataHash } from './hashUtils';
import type { AnalyticsResponse, OrgUnitResponse } from './queryUtils';

const periodSettings: Dhis2PeriodSettings = {
    calendar: 'gregory',
    locale: 'en',
    timeZone: 'UTC',
};

const targetMapping: CovariateMapping = {
    covariateName: 'disease_cases',
    dataItem: {
        id: 'de-target',
        displayName: 'Disease cases',
        dimensionItemType: 'DATA_ELEMENT',
    },
};

const rainfallMapping: CovariateMapping = {
    covariateName: 'rainfall',
    dataItem: {
        id: 'de-rainfall',
        displayName: 'Rainfall',
        dimensionItemType: 'DATA_ELEMENT',
    },
};

const temperatureMapping: CovariateMapping = {
    covariateName: 'mean_temperature',
    dataItem: {
        id: 'de-temperature',
        displayName: 'Mean temperature',
        dimensionItemType: 'DATA_ELEMENT',
    },
};

const model: ModelSpecRead = {
    id: 42,
    name: 'chap_model',
    displayName: 'Chap Model',
    covariates: [],
    target: { name: 'disease_cases', displayName: 'Disease cases', description: '' },
};

const formData: ModelExecutionFormValues = {
    name: 'Backtest',
    periodType: 'MONTH',
    fromPeriodId: '202401',
    toPeriodId: '202403',
    orgUnits: [{ id: 'ou-1' }, { id: 'ou-2' }],
    modelId: '42',
    covariateMappings: [rainfallMapping],
    targetMapping,
};

const analyticsRows: [string, string, string, string][] = [
    ['de-rainfall', 'ou-1', '202401', '10.5'],
    ['de-target', 'ou-1', '202401', '3'],
];

const createAnalyticsResponse = (
    rows: [string, string, string, string][],
): AnalyticsResponse => ({
    response: {
        metaData: { dimensions: { ou: ['ou-1', 'ou-2'] } },
        rows,
    },
});

const analyticsResponse = createAnalyticsResponse(analyticsRows);

const orgUnitResponse: OrgUnitResponse = {
    geojson: {
        organisationUnits: [
            {
                id: 'ou-1',
                displayName: 'Org 1',
                geometry: { type: 'Point', coordinates: [[0, 0]] },
                level: 1,
            },
            {
                id: 'ou-2',
                displayName: 'Org 2',
                geometry: { type: 'Point', coordinates: [[1, 1]] },
                level: 1,
            },
        ],
    },
};

type StubDataEngine = Parameters<typeof prepareBacktestData>[1];

// queryWithAliasFallback first creates a query alias via dataEngine.mutate and
// then reads the result via dataEngine.query on the alias resource. The alias
// ids distinguish the analytics request from the org-unit request.
const createDataEngine = (
    analytics: AnalyticsResponse = analyticsResponse,
) => {
    const query = vi.fn().mockImplementation(
        ({ response }: { response: { resource: string } }) => {
            if (response.resource.includes('alias-analytics')) {
                return Promise.resolve({ response: analytics.response });
            }
            if (response.resource.includes('alias-org-units')) {
                return Promise.resolve({ response: orgUnitResponse.geojson });
            }
            return Promise.reject(new Error(`Unexpected resource: ${response.resource}`));
        },
    );
    const mutate = vi.fn()
        .mockResolvedValueOnce({ id: 'alias-analytics' })
        .mockResolvedValueOnce({ id: 'alias-org-units' });
    return { query, mutate } as unknown as StubDataEngine;
};

const createQueryClient = () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['models'], [model]);
    return queryClient;
};

describe('calculatePeriods', () => {
    it('expands a monthly range into period ids', () => {
        expect(calculatePeriods('MONTH', '202401', '202403', periodSettings))
            .toEqual(['202401', '202402', '202403']);
    });

    it('expands a weekly range into period ids', () => {
        expect(calculatePeriods('WEEK', '2024W1', '2024W3', periodSettings))
            .toEqual(['2024W1', '2024W2', '2024W3']);
    });

    it('returns an empty list for an unsupported period type', () => {
        expect(calculatePeriods('DAY', '202401', '202403', periodSettings))
            .toEqual([]);
    });
});

describe('buildDataItems', () => {
    it('lists only the target data item when no covariates are mapped', () => {
        expect(buildDataItems(targetMapping, [])).toEqual(['de-target']);
    });

    it('lists covariate data items first and the target last', () => {
        expect(buildDataItems(targetMapping, [rainfallMapping, temperatureMapping]))
            .toEqual(['de-rainfall', 'de-temperature', 'de-target']);
    });
});

describe('buildDataSources', () => {
    it('maps only the target when no covariates are mapped', () => {
        expect(buildDataSources(targetMapping, [])).toEqual([
            { covariate: 'disease_cases', dataElementId: 'de-target' },
        ]);
    });

    it('maps each covariate to its data element and appends the target', () => {
        expect(buildDataSources(targetMapping, [rainfallMapping, temperatureMapping]))
            .toEqual([
                { covariate: 'rainfall', dataElementId: 'de-rainfall' },
                { covariate: 'mean_temperature', dataElementId: 'de-temperature' },
                { covariate: 'disease_cases', dataElementId: 'de-target' },
            ]);
    });
});

describe('convertDhis2AnalyticsToChap', () => {
    it('maps analytics rows to observations using the matching data layer', () => {
        const rows: [string, string, string, string][] = [
            ['de-rainfall', 'ou-1', '202401', '10.5'],
            ['de-target', 'ou-2', '202402', '3'],
        ];

        expect(convertDhis2AnalyticsToChap(rows, targetMapping, [rainfallMapping]))
            .toEqual([
                {
                    featureName: 'rainfall',
                    orgUnit: 'ou-1',
                    period: '202401',
                    value: 10.5,
                },
                {
                    featureName: 'disease_cases',
                    orgUnit: 'ou-2',
                    period: '202402',
                    value: 3,
                },
            ]);
    });

    it('throws when a row references an unmapped data item', () => {
        const rows: [string, string, string, string][] = [
            ['de-unknown', 'ou-1', '202401', '1'],
        ];

        expect(() => convertDhis2AnalyticsToChap(rows, targetMapping, [rainfallMapping]))
            .toThrow('Data layer not found for data item id: de-unknown');
    });
});

describe('prepareBacktestData', () => {
    it('throws when the selected model is not in the query cache', async () => {
        const queryClient = createQueryClient();
        const dataEngine = createDataEngine();

        await expect(prepareBacktestData(
            { ...formData, modelId: '999' },
            dataEngine,
            queryClient,
            periodSettings,
        )).rejects.toThrow('Model not found');

        expect(dataEngine.query).not.toHaveBeenCalled();
        expect(dataEngine.mutate).not.toHaveBeenCalled();
    });

    it('throws when an analytics row has no matching data layer', async () => {
        const queryClient = createQueryClient();
        const dataEngine = createDataEngine(
            createAnalyticsResponse([['de-unmapped', 'ou-1', '202401', '1']]),
        );

        await expect(prepareBacktestData(
            formData,
            dataEngine,
            queryClient,
            periodSettings,
        )).rejects.toThrow('Data layer not found');
    });

    it('fetches analytics and org units on a cache miss and stores them in the cache', async () => {
        const queryClient = createQueryClient();
        const dataEngine = createDataEngine();

        const result = await prepareBacktestData(
            formData,
            dataEngine,
            queryClient,
            periodSettings,
        );

        const expectedHash = generateBacktestDataHash(
            ['de-rainfall', 'de-target'],
            ['202401', '202402', '202403'],
            ['ou-1', 'ou-2'],
        );

        expect(result).toEqual({
            model,
            periods: ['202401', '202402', '202403'],
            observations: [
                {
                    featureName: 'rainfall',
                    orgUnit: 'ou-1',
                    period: '202401',
                    value: 10.5,
                },
                {
                    featureName: 'disease_cases',
                    orgUnit: 'ou-1',
                    period: '202401',
                    value: 3,
                },
            ],
            orgUnitResponse,
            orgUnitIds: ['ou-1', 'ou-2'],
            hash: expectedHash,
            dataSources: [
                { covariate: 'rainfall', dataElementId: 'de-rainfall' },
                { covariate: 'disease_cases', dataElementId: 'de-target' },
            ],
        });

        expect(dataEngine.mutate).toHaveBeenCalledTimes(2);
        expect(queryClient.getQueryData(['new-backtest-data', 'analytics', expectedHash]))
            .toEqual(analyticsResponse);
        expect(queryClient.getQueryData(['new-backtest-data', 'org-units', expectedHash]))
            .toEqual(orgUnitResponse);
    });

    it('serves cached analytics and org units without refetching on a cache hit', async () => {
        const queryClient = createQueryClient();
        const dataEngine = createDataEngine();

        const hash = generateBacktestDataHash(
            ['de-rainfall', 'de-target'],
            ['202401', '202402', '202403'],
            ['ou-1', 'ou-2'],
        );
        queryClient.setQueryData(['new-backtest-data', 'analytics', hash], analyticsResponse);
        queryClient.setQueryData(['new-backtest-data', 'org-units', hash], orgUnitResponse);

        const result = await prepareBacktestData(
            formData,
            dataEngine,
            queryClient,
            periodSettings,
        );

        expect(dataEngine.query).not.toHaveBeenCalled();
        expect(dataEngine.mutate).not.toHaveBeenCalled();
        expect(result.hash).toBe(hash);
        expect(result.observations).toHaveLength(2);
        expect(result.orgUnitResponse).toEqual(orgUnitResponse);
    });
});
