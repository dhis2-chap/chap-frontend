import { useAlert, useConfig, useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { CHAP_ROUTE_CODE, useRoute, type Route } from '../useRoute';
import { getRouteTokenStorage } from '../routeToken';
import { useChapStatus } from '../../chapSettings/useChapStatus';
import { getRouteTokenSettings, getRouteUpdateMutation, type RouteChanges } from '../routeMutation';
import { CHAP_ROUTE_AUTHORITY, RECOMMENDED_TIMEOUT_SECONDS } from '../constants';

type SaveRouteVariables = RouteChanges & {
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
    const { serverVersion } = useConfig();
    const { route } = useRoute();
    const { status } = useChapStatus({ route });

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Route saved successfully'),
        { success: true },
    );

    const mutation = useMutation<unknown, Error, SaveRouteVariables>(
        async (variables: SaveRouteVariables) => {
            const { id, url, apiToken, ...changes } = variables;
            // The known CHAP version belongs to the saved URL; a new URL falls back to Bearer, which every CHAP accepts.
            const storage = getRouteTokenStorage(serverVersion, url === route?.url ? status?.chap_core_version : undefined);

            if (id) {
                const queryKey = ['routes', CHAP_ROUTE_CODE];
                const existingRouteData = queryClient.getQueryData<{ routes: Route[] }>(queryKey);

                if (!existingRouteData) {
                    throw new Error(`Route data not found in cache for key ${queryKey}.`);
                }

                const existingRoute = existingRouteData.routes.find(route => route.id === id);

                if (!existingRoute) {
                    throw new Error(`Route with id ${id} not found in cache for update.`);
                }

                return engine.mutate(getRouteUpdateMutation(existingRoute, { url, apiToken, ...changes }, storage));
            } else {
                const createMutation = {
                    resource: 'routes',
                    type: 'create' as const,
                    data: {
                        name: 'Chap Modeling App',
                        code: CHAP_ROUTE_CODE,
                        url: url,
                        authorities: [CHAP_ROUTE_AUTHORITY],
                        ...(apiToken?.trim()
                            ? getRouteTokenSettings({ 'Content-Type': 'application/json' }, apiToken, storage)
                            : { headers: { 'Content-Type': 'application/json' } }),
                        responseTimeoutSeconds: RECOMMENDED_TIMEOUT_SECONDS,
                    },
                };
                return engine.mutate(createMutation);
            }
        },
        {
            onSuccess: () => {
                showSuccessAlert();
                queryClient.invalidateQueries();
                onSuccess?.();
            },
            onError,
        },
    );

    return {
        saveRoute: mutation.mutate,
        isSaving: mutation.isLoading,
        error: mutation.error,
        reset: mutation.reset,
    };
};
