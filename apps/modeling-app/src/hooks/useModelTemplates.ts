import { useQuery } from '@tanstack/react-query';
import { ApiError, ModelTemplateRead, ModelsService } from '@dhis2-chap/ui';

export const useModelTemplates = () => {
    const { data: modelTemplates, error, isLoading } = useQuery<ModelTemplateRead[], ApiError>({
        queryKey: ['modelTemplates'],
        queryFn: () => ModelsService.listModelTemplatesV1CrudModelTemplatesGet(),
        retry: 0,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
    });

    return {
        modelTemplates,
        error,
        isLoading,
    };
};
