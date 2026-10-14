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
