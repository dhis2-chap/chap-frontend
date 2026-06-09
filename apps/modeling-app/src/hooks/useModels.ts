import { ApiError, ModelSpecRead, ModelsService } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type Props = {
    includeArchived?: boolean;
};

export const useModels = ({ includeArchived = false }: Props = {}) => {
    const { data, error, isLoading } = useQuery<ModelSpecRead[], ApiError>({
        queryKey: ['models'],
        queryFn: () => ModelsService.listConfiguredModelsV1CrudConfiguredModelsGet(),
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: 0,
    });

    const models = useMemo(
        () => includeArchived ? data : data?.filter(model => !model.archived),
        [data, includeArchived],
    );

    return {
        models,
        error,
        isLoading,
    };
};
