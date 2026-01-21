import { useDataEngine, useAlert } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import type { Route } from '../../../../hooks/useRoute';

type UpdateRouteTimeoutVariables = {
    route: Route;
    responseTimeoutSeconds: number;
};

export const useUpdateRouteTimeout = () => {
    const queryClient = useQueryClient();
    const engine = useDataEngine();

    const { show: showErrorAlert } = useAlert(
        i18n.t('Error updating route timeout'),
        { critical: true },
    );
    const { show: showSuccessAlert } = useAlert(
        i18n.t('Route timeout updated successfully'),
        { success: true },
    );

    const mutation = useMutation<unknown, Error, UpdateRouteTimeoutVariables>(
        async (variables: UpdateRouteTimeoutVariables) => {
            const { route, responseTimeoutSeconds } = variables;

            const updateMutation = {
                resource: 'routes',
                type: 'update' as const,
                id: route.id,
                data: {
                    ...route,
                    responseTimeoutSeconds,
                },
            };
            return engine.mutate(updateMutation);
        },
        {
            onSuccess: () => {
                showSuccessAlert();
                queryClient.invalidateQueries(['routes']);
            },
            onError: (error: unknown) => {
                showErrorAlert();
                console.error('Error updating route timeout:', error);
            },
        },
    );

    return {
        updateTimeout: mutation.mutate,
        isUpdating: mutation.isLoading,
        error: mutation.error,
    };
};
