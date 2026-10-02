import i18n from '@dhis2/d2-i18n';

const UNAUTHORIZED = 401;

/** Anything with the shape of a generated-client ApiError, so plain Errors pass too. */
type MaybeApiError = { status?: number; message?: string; body?: unknown } | null | undefined;

export const isUnauthorizedError = (error: MaybeApiError) => error?.status === UNAUTHORIZED;

/**
 * CHAP answers a rejected or missing API token with a bare "Unauthorized",
 * which tells an administrator nothing about what to fix.
 */
export const getChapErrorMessage = (error: MaybeApiError) => {
    if (isUnauthorizedError(error)) {
        return i18n.t('The CHAP server refused the request. An administrator can check the API token under Settings, in the route configuration.');
    }
    // FastAPI's validation response contains the useful explanation in detail;
    // the generated client's message is only "Validation Error".
    const body = error?.body;
    if (body && typeof body === 'object' && 'detail' in body) {
        if (typeof body.detail === 'string' && body.detail) {
            return body.detail;
        }
        if (Array.isArray(body.detail)) {
            const messages = body.detail.flatMap((detail) => {
                if (!detail || typeof detail.msg !== 'string') return [];
                const path = Array.isArray(detail.loc)
                    ? detail.loc.filter((part: unknown) => (typeof part === 'string' || typeof part === 'number') && part !== 'body').join('.')
                    : '';
                return [path ? `${path}: ${detail.msg}` : detail.msg];
            });
            if (messages.length) return messages.join('\n');
        }
    }
    return error?.message || i18n.t('An unknown error occurred');
};

/** Short form for compact spots, such as dashboard widgets, where a full sentence does not fit. */
export const getChapErrorLabel = (error: MaybeApiError, fallback: string) => (
    isUnauthorizedError(error)
        ? i18n.t('Not authorized. Check the CHAP API token in settings.')
        : fallback
);

export const getChapErrorTitle = (error: MaybeApiError, fallback: string) => (
    isUnauthorizedError(error)
        ? i18n.t('Not authorized to access the CHAP server')
        : fallback
);
