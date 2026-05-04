import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    ConfiguredModelWithDataSourceRead,
    ModelsService,
} from '@dhis2-chap/ui';

export const CONFIGURED_MODELS_WITH_DATA_SOURCE_QUERY_KEY = 'configuredModelsWithDataSource' as const;

type UseConfiguredModelsWithDataSourceOptions = {
    enabled?: boolean;
};

export const useConfiguredModelsWithDataSource = ({
    enabled = true,
}: UseConfiguredModelsWithDataSourceOptions = {}) => {
    const { data, error, isLoading } = useQuery<ConfiguredModelWithDataSourceRead[], ApiError>({
        queryKey: [CONFIGURED_MODELS_WITH_DATA_SOURCE_QUERY_KEY],
        queryFn: () =>
            ModelsService.listConfiguredModelsWithDataSourceV1CrudConfiguredModelsWithDataSourceGet(),
        enabled,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        configuredModels: data,
        error,
        isLoading,
    };
};
