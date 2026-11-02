import type { Route } from './useRoute';

export const hasPlainTextRouteToken = (route?: Pick<Route, 'headers'>) =>
    Object.entries(route?.headers ?? {}).some(([name, value]) =>
        name.toLowerCase() === 'authorization' && /^(Bearer|ApiToken)\s+\S+/i.test(value),
    );

/** Encrypted credentials are write-only; only the authentication type is returned, so any encrypted auth counts as the token. */
export const hasRouteToken = (route?: Pick<Route, 'headers' | 'auth'>) =>
    route?.auth?.type === 'api-token' || route?.auth?.type === 'api-headers' || hasPlainTextRouteToken(route);

export const supportsEncryptedRouteAuth = (version?: { major: number; minor: number; patch?: number }) =>
    !!version && (version.major > 2 || (version.major === 2 && (
        version.minor >= 42
        || (version.minor === 41 && (version.patch ?? 0) >= 4)
        || (version.minor === 40 && (version.patch ?? 0) >= 7)
    )));

/** Chap Core accepts `Authorization: ApiToken` from 2.5.0; older servers only accept Bearer. */
const supportsChapApiToken = (version = '') => {
    const [major = 0, minor = 0] = version.split('.').map(Number);
    return major > 2 || (major === 2 && minor >= 5);
};

export type RouteTokenStorage = 'api-token' | 'api-headers';

/**
 * Tokens are only ever stored encrypted; returns undefined when DHIS2 cannot encrypt route auth.
 * Unknown Chap versions (e.g. before the route exists) use encrypted Bearer headers, which every Chap accepts.
 */
export const getRouteTokenStorage = (
    dhis2Version?: { major: number; minor: number; patch?: number },
    chapVersion?: string,
): RouteTokenStorage | undefined => {
    if (!supportsEncryptedRouteAuth(dhis2Version)) {
        return undefined;
    }
    return supportsChapApiToken(chapVersion) ? 'api-token' : 'api-headers';
};

/** Header names are case-insensitive. */
export const removeRouteToken = (headers: Record<string, string> = {}): Record<string, string> =>
    Object.fromEntries(Object.entries(headers).filter(([name]) => name.toLowerCase() !== 'authorization'));
