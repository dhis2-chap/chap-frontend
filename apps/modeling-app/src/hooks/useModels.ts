import { ApiError, CrudService, ModelSpecRead } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';

type Props = {
    includeArchived?: boolean;
};

export const useModels = ({ includeArchived = false }: Props = {}) => {
    const { data, error, isLoading } = useQuery<ModelSpecRead[], ApiError>({
        queryKey: ['models'],
        queryFn: () => CrudService.listConfiguredModelsCrudConfiguredModelsGet(),
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: 0,
        select: data => includeArchived ? data : data.filter(model => !model.archived),
    });

    return {
        models: data,
        error,
        isLoading,
    };
};
