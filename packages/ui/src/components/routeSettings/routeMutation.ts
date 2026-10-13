import i18n from '@dhis2/d2-i18n';
import type { Route } from './useRoute';
import { updateRouteToken } from './routeToken';

export type RouteChanges = {
    url?: string;
    responseTimeoutSeconds?: number;
    apiToken?: string;
    removeApiToken?: boolean;
};

export const routeTokenReentryMessage = () => i18n.t('DHIS2 cannot preserve encrypted authentication when updating this route. Re-enter the CHAP API token, or explicitly remove it, before saving.');

export const getRouteTokenSettings = (headers: Record<string, string>, apiToken: string, encrypted: boolean) => encrypted
    ? {
            headers: updateRouteToken(headers, '', true),
            auth: { type: 'api-token', token: apiToken.trim() },
        }
    : { headers: updateRouteToken(headers, apiToken) };

export const getRouteUpdateMutation = (route: Route, changes: RouteChanges, encrypted: boolean) => {
    const { apiToken = '', removeApiToken = false, ...fields } = changes;
    // DHIS2 2.42.6 drops write-only auth credentials even during JSON PATCH.
    // Never send a read-back auth object or assume omitting auth preserves it.
    if (route.auth && !apiToken.trim() && !removeApiToken) {
        throw new Error(routeTokenReentryMessage());
    }
    const tokenSettings = removeApiToken
        ? { headers: updateRouteToken(route.headers, '', true), ...(route.auth && { auth: null }) }
        : apiToken.trim()
            ? getRouteTokenSettings(route.headers, apiToken, encrypted || !!route.auth)
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
