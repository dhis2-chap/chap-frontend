import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelTemplateRead } from '@dhis2-chap/ui';
import { ModelsService } from '@dhis2-chap/ui';
import { fetchModels } from './modelsQuery';
import { hasRevisionMismatch, type ModelWithHealth } from '../utils/modelHealth';

vi.mock('@dhis2-chap/ui', () => ({
    ModelsService: {
        listConfiguredModelsV1CrudConfiguredModelsGet: vi.fn(),
        listModelTemplatesV1CrudModelTemplatesGet: vi.fn(),
    },
}));

const listModels = vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet);
const listTemplates = vi.mocked(ModelsService.listModelTemplatesV1CrudModelTemplatesGet);
const model: ModelWithHealth = {
    id: 1,
    name: 'ewars:custom',
    version: '1.0',
    usesChapkit: true,
    covariates: [],
    target: { name: 'disease_cases', displayName: 'Cases', description: 'Cases' },
};
const template: ModelTemplateRead = {
    id: 20,
    name: 'ewars',
    version: '1.0',
    usesChapkit: true,
    healthStatus: 'revision_mismatch',
};

beforeEach(() => {
    vi.resetAllMocks();
    listModels.mockResolvedValue([model]);
    listTemplates.mockResolvedValue([template]);
});

describe('model health', () => {
    it.each(['ewars', 'ewars:custom'])('resolves template health for %s on the same version', async (name) => {
        listModels.mockResolvedValue([{ ...model, name }]);
        expect(await fetchModels()).toEqual([{ ...model, name, healthStatus: 'revision_mismatch' }]);
    });

    it.each([
        [{ ...template, version: '2.0' }],
        [{ ...template, name: 'ewar' }],
        [template, { ...template, id: 21 }],
        [template, { ...template, id: 21, name: 'ewars:custom' }],
        [{ ...template, usesChapkit: false }],
        [],
    ])('does not guess when the template match is absent or ambiguous (%j)', async (...templates) => {
        listTemplates.mockResolvedValue(templates);
        expect(await fetchModels()).toEqual([model]);
    });

    it.each([{}, { usesChapkit: true }, { version: '1.0' }])('keeps older models without health metadata usable (%j)', async (metadata) => {
        const legacyModel = { ...model };
        delete legacyModel.version;
        delete legacyModel.usesChapkit;
        listModels.mockResolvedValue([{ ...legacyModel, ...metadata }]);
        const result = await fetchModels();
        expect(result).toEqual([{ ...legacyModel, ...metadata }]);
        expect(hasRevisionMismatch(result[0])).toBe(false);
        expect(listTemplates).not.toHaveBeenCalled();
    });

    it.each([undefined, null, 'future_status'])('does not block an unrecognized template health value (%s)', async (healthStatus) => {
        listTemplates.mockResolvedValue([{ ...template, healthStatus }]);
        expect(hasRevisionMismatch((await fetchModels())[0])).toBe(false);
    });

    it.each([404, 405, 500])('keeps configured models when the optional endpoint returns %s', async (status) => {
        listTemplates.mockRejectedValue({ status });
        expect(await fetchModels()).toEqual([model]);
    });

    it('does not swallow configured-model failures', async () => {
        const error = new Error('Configured models unavailable');
        listModels.mockRejectedValue(error);
        await expect(fetchModels()).rejects.toBe(error);
        expect(listTemplates).not.toHaveBeenCalled();
    });

    it('recomputes health on each listing, including recovery', async () => {
        expect(hasRevisionMismatch((await fetchModels())[0])).toBe(true);
        listTemplates.mockResolvedValue([{ ...template, healthStatus: 'live' }]);
        expect((await fetchModels())[0].healthStatus).toBe('live');
    });
});
