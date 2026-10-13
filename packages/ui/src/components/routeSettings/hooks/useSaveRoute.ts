import { useAlert, useConfig, useDataEngine } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { CHAP_ROUTE_CODE, type Route } from '../useRoute';
import { supportsEncryptedRouteAuth } from '../routeToken';
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
    const encrypted = supportsEncryptedRouteAuth(serverVersion);

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Route saved successfully'),
        { success: true },
    );

    const mutation = useMutation<unknown, Error, SaveRouteVariables>(
        async (variables: SaveRouteVariables) => {
            const { id, url, apiToken, ...changes } = variables;

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

                return engine.mutate(getRouteUpdateMutation(existingRoute, { url, apiToken, ...changes }, encrypted));
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
                            ? getRouteTokenSettings({ 'Content-Type': 'application/json' }, apiToken, encrypted)
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
