import { ModelsService } from '@dhis2-chap/ui';

export const modelsQueryOptions = {
    queryKey: ['models'],
    queryFn: () => ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet(),
    staleTime: 30_000,
    cacheTime: Infinity,
    retry: 0,
};
