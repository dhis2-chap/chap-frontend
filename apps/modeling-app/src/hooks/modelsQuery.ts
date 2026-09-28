import { ModelsService } from '@dhis2-chap/ui';
import { addTemplateHealth, hasTemplateHealth, type ModelWithHealth } from '../utils/modelHealth';

export const fetchModels = async (): Promise<ModelWithHealth[]> => {
    const models = await ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet();
    if (!models.some(hasTemplateHealth)) return models;

    try {
        const templates = await ModelsService.listModelTemplatesV1CrudModelTemplatesGet();
        return addTemplateHealth(models, templates);
    } catch {
        // Health is extra information. If the template listing fails, still show
        // the configured models; the backend rejects a mismatched run anyway.
        return models;
    }
};

export const modelsQueryOptions = {
    queryKey: ['models'],
    queryFn: fetchModels,
    staleTime: 30_000,
    cacheTime: Infinity,
    retry: 0,
};
