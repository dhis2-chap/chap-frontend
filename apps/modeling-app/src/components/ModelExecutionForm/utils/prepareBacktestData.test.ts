import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ModelsService } from '@dhis2-chap/ui';
import type { useDataEngine } from '@dhis2/app-runtime';
import type { ModelExecutionFormValues } from '../hooks/useModelExecutionFormState';
import { prepareBacktestData } from './prepareBacktestData';
import { fetchAnalytics, fetchOrgUnits } from './queryUtils';
import type { ModelSpecRead, ModelTemplateRead } from '@dhis2-chap/ui';

vi.mock('@dhis2-chap/ui', () => ({
    ModelsService: {
        listConfiguredModelsV1CrudConfiguredModelsGet: vi.fn(),
        listModelTemplatesV1CrudModelTemplatesGet: vi.fn(),
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
const template: ModelTemplateRead = { id: 20, name: 'ewars', version: '1.0', usesChapkit: true };
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
        vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet).mockResolvedValue([model]);
        vi.mocked(ModelsService.listModelTemplatesV1CrudModelTemplatesGet)
            .mockResolvedValue([{ ...template, healthStatus: 'revision_mismatch' }]);

        await expect(prepareBacktestData(form, dataEngine, client, settings))
            .rejects.toThrow('The model developer must publish a new version');
        expect(fetchAnalytics).not.toHaveBeenCalled();
        expect(fetchOrgUnits).not.toHaveBeenCalled();
        client.clear();
    });

    it('recovers from a cached mismatch once the model is healthy again', async () => {
        const client = new QueryClient();
        client.setQueryData(['models'], [{ ...model, healthStatus: 'revision_mismatch' }]);
        vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet).mockResolvedValue([model]);
        // Simulate an older backend without the optional template URL.
        vi.mocked(ModelsService.listModelTemplatesV1CrudModelTemplatesGet).mockRejectedValue({ status: 404 });

        const result = await prepareBacktestData(form, dataEngine, client, settings);
        expect(result.model).toEqual(model);
        expect(result.observations).toEqual([{ featureName: 'disease_cases', orgUnit: 'org-unit', period: '202401', value: 12 }]);
        client.clear();
    });
});
