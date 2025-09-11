import { useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { useAlert } from '@dhis2/app-service-alerts';
import { CHAP_MODELING_APP_AUTHORITY } from '../../../../utils/global-authorities';
import type { Route } from '../../../../hooks/useRoute';

type SaveRouteVariables = {
    url: string;
    id?: string;
};

type UseSaveRouteOptions = {
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
};

export const useSaveRoute = ({ onSuccess, onError }: UseSaveRouteOptions = {}) => {
    const queryClient = useQueryClient();
    const engine = useDataEngine();

    const { show: showErrorAlert } = useAlert(
        i18n.t('Error saving route'),
        { critical: true },
    );
    const { show: showSuccessAlert } = useAlert(
        i18n.t('Route saved successfully'),
        { success: true },
    );

    const mutation = useMutation<unknown, Error, SaveRouteVariables>(
        async (variables: SaveRouteVariables) => {
            const { id, url } = variables;

            if (id) {
                const queryKey = ['routes', 'chap'];
                const existingRouteData = queryClient.getQueryData<{ routes: Route[] }>(queryKey);

                if (!existingRouteData) {
                    throw new Error(`Route data not found in cache for key ${queryKey}.`);
                }

                const existingRoute = existingRouteData.routes.find(route => route.id === id);

                if (!existingRoute) {
                    throw new Error(`Route with id ${id} not found in cache for update.`);
                }

                const updateMutation = {
                    resource: 'routes',
                    type: 'update' as const,
                    id: id,
                    data: {
                        ...(existingRoute || {}),
                        url: url,
                    },
                };
                return engine.mutate(updateMutation);
            } else {
                const createMutation = {
                    resource: 'routes',
                    type: 'create' as const,
                    data: {
                        name: 'Chap Modeling App',
                        code: 'chap',
                        url: url,
                        authorities: [CHAP_MODELING_APP_AUTHORITY],
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                };
                return engine.mutate(createMutation);
            }
        },
        {
            onSuccess: () => {
                showSuccessAlert();
                queryClient.invalidateQueries(['routes']);
                onSuccess?.();
            },
            onError: (error: unknown) => {
                showErrorAlert();
                console.error('Error saving route:', error);
                onError?.(error);
            },
        },
    );

    return {
        saveRoute: mutation.mutate,
        isSaving: mutation.isLoading,
        error: mutation.error,
    };
};
