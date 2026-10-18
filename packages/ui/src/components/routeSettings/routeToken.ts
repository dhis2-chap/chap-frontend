import type { Route } from './useRoute';

export const hasPlainTextRouteToken = (route?: Pick<Route, 'headers'>) =>
    Object.entries(route?.headers ?? {}).some(([name, value]) =>
        name.toLowerCase() === 'authorization' && /^(Bearer|ApiToken)\s+\S+/i.test(value),
    );

/** Encrypted credentials are write-only; only the authentication type is returned. */
export const hasRouteToken = (route?: Pick<Route, 'headers' | 'auth'>) =>
    route?.auth?.type === 'api-token' || route?.auth?.type === 'api-headers' || hasPlainTextRouteToken(route);

export const supportsEncryptedRouteAuth = (version?: { major: number; minor: number; patch?: number }) =>
    !!version && (version.major > 2 || (version.major === 2 && (
        version.minor >= 42
        || (version.minor === 41 && (version.patch ?? 0) >= 4)
        || (version.minor === 40 && (version.patch ?? 0) >= 7)
    )));

/** CHAP Core accepts `Authorization: ApiToken` from 2.5.0; older servers only accept Bearer. */
const supportsChapApiToken = (version = '') => {
    const [major = 0, minor = 0] = version.split('.').map(Number);
    return major > 2 || (major === 2 && minor >= 5);
};

export type RouteTokenStorage = 'api-token' | 'api-headers' | 'header';

/** Unknown CHAP versions (e.g. before the route exists) use encrypted Bearer headers, which every CHAP accepts. */
export const getRouteTokenStorage = (
    dhis2Version?: { major: number; minor: number; patch?: number },
    chapVersion?: string,
): RouteTokenStorage => {
    if (!supportsEncryptedRouteAuth(dhis2Version)) {
        return 'header';
    }
    return supportsChapApiToken(chapVersion) ? 'api-token' : 'api-headers';
};

export const updateRouteToken = (
    headers: Record<string, string> = {},
    apiToken = '',
    removeApiToken = false,
): Record<string, string> => {
    if (!apiToken.trim() && !removeApiToken) {
        return { ...headers };
    }
    const updated = Object.fromEntries(
        Object.entries(headers).filter(([name]) => name.toLowerCase() !== 'authorization'),
    );
    if (!removeApiToken && apiToken.trim()) {
        updated.Authorization = `Bearer ${apiToken.trim()}`;
    }
    return updated;
};
