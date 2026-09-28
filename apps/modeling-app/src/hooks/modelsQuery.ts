import { QueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { ModelsService, type ModelSpecRead } from '@dhis2-chap/ui';
import { hasRevisionMismatch, revisionMismatchOnSubmitMessage } from '@/utils/modelHealth';

export const modelsQueryOptions = {
    queryKey: ['models'],
    queryFn: () => ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet(),
    staleTime: 30_000,
    cacheTime: Infinity,
    retry: 0,
};

/**
 * Health can change after selection. Re-read the model right before a job is
 * submitted, even when the form's model cache is still fresh.
 */
export const fetchRunnableModel = async (
    queryClient: QueryClient,
    modelId: number,
): Promise<ModelSpecRead> => {
    const models = await queryClient.fetchQuery({ ...modelsQueryOptions, staleTime: 0 });
    const model = models.find(model => model.id === modelId);

    if (!model) {
        throw new Error(i18n.t('Model not found'));
    }

    if (hasRevisionMismatch(model)) {
        throw new Error(revisionMismatchOnSubmitMessage(model));
    }

    return model;
};
