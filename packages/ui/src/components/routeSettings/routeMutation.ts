import i18n from '@dhis2/d2-i18n';
import type { Route } from './useRoute';
import { removeRouteToken, type RouteTokenStorage } from './routeToken';

export type RouteChanges = {
    url?: string;
    responseTimeoutSeconds?: number;
    apiToken?: string;
    removeApiToken?: boolean;
};

export const routeTokenReentryMessage = () => i18n.t('DHIS2 cannot preserve encrypted authentication when updating this route. Re-enter the Chap API token, or explicitly remove it, before saving. Saving replaces all encrypted authentication on the route, including custom headers.');

export const unsupportedRouteTokenMessage = () => i18n.t('This app does not support setting API tokens on this DHIS2 version. Upgrade DHIS2 to 2.40.7, 2.41.4, 2.42 or later to store the token encrypted.');

export const getRouteTokenSettings = (headers: Record<string, string>, apiToken: string, storage?: RouteTokenStorage) => {
    if (!storage) {
        throw new Error(unsupportedRouteTokenMessage());
    }
    const token = apiToken.trim();
    return {
        headers: removeRouteToken(headers),
        auth: storage === 'api-token'
            ? { type: 'api-token', token }
            : { type: 'api-headers', headers: { Authorization: `Bearer ${token}` } },
    };
};

export const getRouteUpdateMutation = (route: Route, changes: RouteChanges, storage?: RouteTokenStorage) => {
    const { apiToken = '', removeApiToken = false, ...fields } = changes;
    // DHIS2 2.42.6 drops write-only auth credentials even during JSON PATCH.
    // Never send a read-back auth object or assume omitting auth preserves it.
    if (route.auth && !apiToken.trim() && !removeApiToken) {
        throw new Error(routeTokenReentryMessage());
    }
    const tokenSettings = removeApiToken
        ? { headers: removeRouteToken(route.headers), ...(route.auth && { auth: null }) }
        : apiToken.trim()
            ? getRouteTokenSettings(route.headers, apiToken, storage)
            : {};

    return {
        resource: 'routes',
        type: 'json-patch' as const,
        id: route.id,
        data: Object.entries({ ...fields, ...tokenSettings })
            .filter(([, value]) => value !== undefined)
            .map(([name, value]) => ({ op: 'add', path: `/${name}`, value })),
    };
};
