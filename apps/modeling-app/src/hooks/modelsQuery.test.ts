import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ModelsService, type ModelSpecRead } from '@dhis2-chap/ui';
import { fetchRunnableModel } from './modelsQuery';

vi.mock('@dhis2-chap/ui', () => ({
    ModelsService: {
        listConfiguredModelsV1CrudConfiguredModelsGet: vi.fn(),
    },
}));

const model = { id: 1, name: 'ewars', version: '1.0' } as ModelSpecRead;
const client = new QueryClient();

afterEach(() => {
    vi.resetAllMocks();
    client.clear();
});

describe('fetchRunnableModel', () => {
    it('rejects a model that is missing from the latest list', async () => {
        vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet).mockResolvedValue([]);

        await expect(fetchRunnableModel(client, 1)).rejects.toThrow('Model not found');
    });

    it('keeps the cached models when the refresh fails, so open forms stay mounted', async () => {
        client.setQueryData(['models'], [model]);
        vi.mocked(ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet)
            .mockRejectedValue(new Error('Network down'));

        await expect(fetchRunnableModel(client, 1)).rejects.toThrow('Network down');
        expect(client.getQueryData(['models'])).toEqual([model]);
    });
});
