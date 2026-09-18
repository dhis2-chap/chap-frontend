import { ModelsService } from '@dhis2-chap/ui';
import { addTemplateHealth, needsTemplateHealth, type ModelWithHealth } from '../utils/modelHealth';

export const fetchModels = async (): Promise<ModelWithHealth[]> => {
    const models: ModelWithHealth[] = await ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet();
    if (!models.some(needsTemplateHealth)) return models;

    try {
        const templates = await ModelsService.listModelTemplatesV1CrudModelTemplatesGet();
        return addTemplateHealth(models, templates);
    } catch {
        // Health is optional: older servers may not expose this endpoint. A failed
        // optional read must not hide the configured models or prevent their use.
        return models;
    }
};

export const modelsQueryOptions = {
    queryKey: ['models'],
    queryFn: fetchModels,
    staleTime: 30_000,
    retry: 0,
};
