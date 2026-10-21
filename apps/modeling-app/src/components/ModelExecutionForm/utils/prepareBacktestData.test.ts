import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ModelsService } from '@dhis2-chap/ui';
import type { useDataEngine } from '@dhis2/app-runtime';
import type { ModelExecutionFormValues } from '../hooks/useModelExecutionFormState';
import { prepareBacktestData } from './prepareBacktestData';
import { fetchAnalytics, fetchOrgUnits } from './queryUtils';
import type { ModelSpecRead } from '@dhis2-chap/ui';

vi.mock('@dhis2-chap/ui', () => ({
    ModelsService: {
        listConfiguredModelsV1CrudConfiguredModelsGet: vi.fn(),
    },
}));
vi.mock('./queryUtils', () => ({ fetchAnalytics: vi.fn(), fetchOrgUnits: vi.fn() }));

const model: ModelSpecRead = {
    id: 1,
    name: 'ewars',
    version: '1.0',
    usesChapkit: true,
    covariates: [],
    target: { name: 'disease_cases', displayName: 'Cases', description: 'Cases' },
};
const form: ModelExecutionFormValues = {
    name: 'Test run',
    periodType: 'MONTH',
    fromPeriodId: '202401',
    toPeriodId: '202402',
    modelId: '1',
    orgUnits: [{ id: 'org-unit' }],
    covariateMappings: [],
    targetMapping: {
        covariateName: 'disease_cases',
        dataItem: { id: 'cases', displayName: 'Cases', dimensionItemType: 'DATA_ELEMENT' },
    },
};
const settings = { calendar: 'gregory', locale: 'en', timeZone: 'UTC' } as const;
const dataEngine = {} as ReturnType<typeof useDataEngine>;

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchAnalytics).mockResolvedValue({
        response: { metaData: { dimensions: { ou: ['org-unit'] } }, rows: [['cases', 'org-unit', '202401', '12']] },
    });
    vi.mocked(fetchOrgUnits).mockResolvedValue({ geojson: { organisationUnits: [] } });
});

describe('shared evaluation and prediction preflight', () => {
    it('rejects a newly mismatched model before fetching data, despite a fresh live cache', async () => {
        const client = new QueryClient();
        client.setQueryData(['models'], [model]);
        vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet)
            .mockResolvedValue([{ ...model, healthStatus: 'revision_mismatch' }]);

        await expect(prepareBacktestData(form, dataEngine, client, settings))
            .rejects.toThrow('its service changed after you selected it');
        expect(fetchAnalytics).not.toHaveBeenCalled();
        expect(fetchOrgUnits).not.toHaveBeenCalled();
        client.clear();
    });

    it('rejects mappings that leave a model covariate unmapped before fetching data', async () => {
        const client = new QueryClient();
        const withRh = { ...model, covariates: [{ name: 'RH', displayName: 'RH', description: 'RH' }] };
        vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet).mockResolvedValue([withRh]);

        await expect(prepareBacktestData(form, dataEngine, client, settings))
            .rejects.toThrow('Not mapped: RH');
        expect(fetchAnalytics).not.toHaveBeenCalled();
        client.clear();
    });

    it('sends only the model covariates, under every covariate a data item is mapped to', async () => {
        const client = new QueryClient();
        const covariate = (name: string) => ({ name, displayName: name, description: name });
        const humidity = { id: 'hum', displayName: 'Humidity', dimensionItemType: 'DATA_ELEMENT' } as const;
        vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet)
            .mockResolvedValue([{ ...model, covariates: [covariate('RH'), covariate('humidity_lagged')] }]);
        vi.mocked(fetchAnalytics).mockResolvedValue({
            response: { metaData: { dimensions: { ou: ['org-unit'] } }, rows: [['hum', 'org-unit', '202401', '80']] },
        });
        const copiedForm = {
            ...form,
            covariateMappings: [
                { covariateName: 'humidity', dataItem: humidity },
                { covariateName: 'RH', dataItem: humidity },
                { covariateName: 'humidity_lagged', dataItem: humidity },
            ],
        };

        const result = await prepareBacktestData(copiedForm, dataEngine, client, settings);
        expect(result.observations.map(observation => observation.featureName)).toEqual(['RH', 'humidity_lagged']);
        expect(result.dataSources.map(dataSource => dataSource.covariate)).toEqual(['RH', 'humidity_lagged', 'disease_cases']);
        client.clear();
    });

    it('recovers from a cached mismatch once the model is healthy again', async () => {
        const client = new QueryClient();
        client.setQueryData(['models'], [{ ...model, healthStatus: 'revision_mismatch' }]);
        vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet).mockResolvedValue([model]);

        const result = await prepareBacktestData(form, dataEngine, client, settings);
        expect(result.model).toEqual(model);
        expect(result.observations).toEqual([{ featureName: 'disease_cases', orgUnit: 'org-unit', period: '202401', value: 12 }]);
        client.clear();
    });
});
