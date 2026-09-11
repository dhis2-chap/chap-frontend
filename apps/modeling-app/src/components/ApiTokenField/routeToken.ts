/** Header names are case-insensitive. Never show the saved credential in the form. */
export const hasRouteToken = (headers: Record<string, string> = {}) =>
    Object.entries(headers).some(([name, value]) =>
        name.toLowerCase() === 'authorization' && /^Bearer\s+\S+/i.test(value),
    );

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
