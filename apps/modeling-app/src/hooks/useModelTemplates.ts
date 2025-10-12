import { useQuery } from '@tanstack/react-query';
import { ApiError, CrudService, ModelTemplateRead } from '@dhis2-chap/ui';
import { Route } from './useRoute';

type Props = {
    route: Route | undefined;
};

export const useModelTemplates = ({ route }: Props) => {
    const { data: modelTemplates, error, isLoading } = useQuery<ModelTemplateRead[], ApiError>({
        queryKey: ['modelTemplates', route?.url],
        queryFn: () => CrudService.listModelTemplatesCrudModelTemplatesGet(),
        enabled: !!route,
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
