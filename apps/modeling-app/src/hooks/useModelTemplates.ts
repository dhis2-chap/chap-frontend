import { useQuery } from '@tanstack/react-query';
import { ApiError, CrudService, ModelTemplateRead } from '@dhis2-chap/ui';

export const useModelTemplates = () => {
    const { data: modelTemplates, error, isLoading } = useQuery<ModelTemplateRead[], ApiError>({
        queryKey: ['modelTemplates'],
        queryFn: () => CrudService.listModelTemplatesCrudModelTemplatesGet(),
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
