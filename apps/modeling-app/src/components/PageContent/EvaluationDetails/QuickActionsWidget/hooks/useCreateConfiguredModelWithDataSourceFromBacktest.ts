import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import {
    ApiError,
    ConfiguredModelWithDataSourceFromBacktestCreate,
    ConfiguredModelWithDataSourceRead,
    ModelsService,
} from '@dhis2-chap/ui';
import { BACKTESTS_LIST_QUERY_KEY } from '@/hooks/useBacktests';
import { CONFIGURED_MODELS_WITH_DATA_SOURCE_QUERY_KEY } from '@/hooks/useConfiguredModelsWithDataSource';

type CreateConfiguredModelWithDataSourceFromBacktestVariables = {
    backtestId: number;
    data: ConfiguredModelWithDataSourceFromBacktestCreate;
};

type UseCreateConfiguredModelWithDataSourceFromBacktestOptions = {
    onSuccess?: (configuredModelWithDataSource: ConfiguredModelWithDataSourceRead) => void;
    onError?: (error: ApiError) => void;
};

export const useCreateConfiguredModelWithDataSourceFromBacktest = ({
    onSuccess,
    onError,
}: UseCreateConfiguredModelWithDataSourceFromBacktestOptions = {}) => {
    const queryClient = useQueryClient();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Prediction setup created'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to create prediction setup'),
        { critical: true },
    );

    const mutation = useMutation<
        ConfiguredModelWithDataSourceRead,
        ApiError,
        CreateConfiguredModelWithDataSourceFromBacktestVariables
    >({
        mutationFn: ({ backtestId, data }) =>
            ModelsService.createConfiguredModelWithDataSourceFromBacktestV1CrudConfiguredModelsWithDataSourceFromBacktestBacktestIdPost(
                backtestId,
                data,
            ),
        onSuccess: (configuredModelWithDataSource, { backtestId }) => {
            queryClient.invalidateQueries({ queryKey: [BACKTESTS_LIST_QUERY_KEY, backtestId] });
            queryClient.invalidateQueries({ queryKey: [CONFIGURED_MODELS_WITH_DATA_SOURCE_QUERY_KEY] });
            showSuccessAlert();
            onSuccess?.(configuredModelWithDataSource);
        },
        onError: (error) => {
            showErrorAlert();
            onError?.(error);
        },
    });

    return {
        createConfiguredModelWithDataSourceFromBacktest: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
        reset: mutation.reset,
    };
};
