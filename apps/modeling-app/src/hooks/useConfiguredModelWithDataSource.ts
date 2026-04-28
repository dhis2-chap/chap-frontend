import { useQuery } from '@tanstack/react-query';
import {
    ApiError,
    ConfiguredModelWithDataSourceReadWithPredictions,
    ModelsService,
} from '@dhis2-chap/ui';
import { CONFIGURED_MODELS_WITH_DATA_SOURCE_QUERY_KEY } from './useConfiguredModelsWithDataSource';

export const useConfiguredModelWithDataSource = (configuredId: string | undefined) => {
    const configuredModelWithDataSourceId = Number(configuredId);
    const hasValidConfiguredId = Number.isFinite(configuredModelWithDataSourceId);

    const { data, error, isLoading, isFetching, isError } = useQuery<
        ConfiguredModelWithDataSourceReadWithPredictions,
        ApiError
    >({
        queryKey: [
            CONFIGURED_MODELS_WITH_DATA_SOURCE_QUERY_KEY,
            configuredModelWithDataSourceId,
        ],
        queryFn: () =>
            ModelsService.getConfiguredModelWithDataSourceV1CrudConfiguredModelsWithDataSourceConfiguredModelWithDataSourceIdGet(
                configuredModelWithDataSourceId,
            ),
        enabled: hasValidConfiguredId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        configuredModelWithDataSource: data,
        error,
        hasValidConfiguredId,
        isLoading: isLoading || isFetching,
        isError,
    };
};
