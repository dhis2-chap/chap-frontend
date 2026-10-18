import i18n from '@dhis2/d2-i18n';
import type { Route } from './useRoute';
import { updateRouteToken, type RouteTokenStorage } from './routeToken';

export type RouteChanges = {
    url?: string;
    responseTimeoutSeconds?: number;
    apiToken?: string;
    removeApiToken?: boolean;
};

export const routeTokenReentryMessage = () => i18n.t('DHIS2 cannot preserve encrypted authentication when updating this route. Re-enter the CHAP API token, or explicitly remove it, before saving.');

export const getRouteTokenSettings = (headers: Record<string, string>, apiToken: string, storage: RouteTokenStorage) => {
    const token = apiToken.trim();
    if (storage === 'header') {
        return { headers: updateRouteToken(headers, token) };
    }
    return {
        headers: updateRouteToken(headers, '', true),
        auth: storage === 'api-token'
            ? { type: 'api-token', token }
            : { type: 'api-headers', headers: { Authorization: `Bearer ${token}` } },
    };
};

export const getRouteUpdateMutation = (route: Route, changes: RouteChanges, storage: RouteTokenStorage) => {
    const { apiToken = '', removeApiToken = false, ...fields } = changes;
    // DHIS2 2.42.6 drops write-only auth credentials even during JSON PATCH.
    // Never send a read-back auth object or assume omitting auth preserves it.
    if (route.auth && !apiToken.trim() && !removeApiToken) {
        throw new Error(routeTokenReentryMessage());
    }
    const tokenSettings = removeApiToken
        ? { headers: updateRouteToken(route.headers, '', true), ...(route.auth && { auth: null }) }
        : apiToken.trim()
            ? getRouteTokenSettings(route.headers, apiToken, storage === 'header' && route.auth ? 'api-headers' : storage)
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
