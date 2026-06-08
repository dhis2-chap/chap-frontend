import { useDataEngine, useAlert } from '@dhis2/app-runtime';
import i18n from '@dhis2/d2-i18n';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { DATASTORE_NAMESPACE } from '@/constants';
import {
    PluginConfig,
    PluginConfigSchema,
} from '@/types';
import { isDhis2NotFound } from '@/utils/dhis2Error';

const getConfigResource = (dashboardItemId: string) => (
    `dataStore/${DATASTORE_NAMESPACE}/${dashboardItemId}`
);

const getConfigQueryKey = (dashboardItemId: string) => [
    'dataStore',
    DATASTORE_NAMESPACE,
    dashboardItemId,
];

export const useDashboardItemConfig = (dashboardItemId: string | undefined) => {
    const engine = useDataEngine();

    return useQuery<PluginConfig | null>({
        queryKey: dashboardItemId
            ? getConfigQueryKey(dashboardItemId)
            : ['dataStore', DATASTORE_NAMESPACE, 'missing-dashboard-item'],
        enabled: !!dashboardItemId,
        queryFn: async () => {
            try {
                const response = await engine.query({
                    config: {
                        resource: getConfigResource(dashboardItemId ?? ''),
                    },
                });
                return PluginConfigSchema.parse(response.config);
            } catch (error) {
                if (isDhis2NotFound(error)) {
                    return null;
                }

                throw error;
            }
        },
    });
};

type SaveDashboardItemConfigOptions = {
    showSuccessAlert?: boolean;
};

export const useSaveDashboardItemConfig = (
    dashboardItemId: string | undefined,
    options: SaveDashboardItemConfigOptions = {},
) => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    const { show: showSuccessAlert } = useAlert(i18n.t('Chart configuration saved'), { success: true });
    const { show: showErrorAlert } = useAlert(i18n.t('Failed to save chart configuration'), { critical: true });
    const shouldShowSuccessAlert = options.showSuccessAlert ?? true;

    return useMutation<unknown, Error, PluginConfig>({
        mutationFn: async (config) => {
            if (!dashboardItemId) {
                throw new Error('Missing dashboard item id');
            }

            return engine.mutate({
                resource: getConfigResource(dashboardItemId),
                type: 'update' as const,
                id: '',
                data: config,
            });
        },
        onSuccess: (_result, config) => {
            if (dashboardItemId) {
                queryClient.setQueryData(getConfigQueryKey(dashboardItemId), config);
            }

            if (shouldShowSuccessAlert) {
                showSuccessAlert();
            }
        },
        onError: (error) => {
            console.error('Failed to save chart configuration:', error);
            showErrorAlert();
        },
    });
};

export const useDeleteDashboardItemConfig = (dashboardItemId: string | undefined) => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();

    return useMutation<unknown, Error, void>({
        mutationFn: async () => {
            if (!dashboardItemId) {
                return undefined;
            }

            try {
                return await engine.mutate({
                    resource: getConfigResource(dashboardItemId),
                    type: 'delete' as const,
                    id: '',
                });
            } catch (error) {
                if (isDhis2NotFound(error)) {
                    return undefined;
                }

                throw error;
            }
        },
        onSuccess: () => {
            if (dashboardItemId) {
                queryClient.setQueryData(getConfigQueryKey(dashboardItemId), null);
            }
        },
    });
};
