import i18n from '@dhis2/d2-i18n';

const UNAUTHORIZED = 401;

/** Anything with the shape of a generated-client ApiError, so plain Errors pass too. */
type MaybeApiError = { status?: number; message?: string } | null | undefined;

export const isUnauthorizedError = (error: MaybeApiError) => error?.status === UNAUTHORIZED;

/**
 * CHAP answers a rejected or missing API token with a bare "Unauthorized",
 * which tells an administrator nothing about what to fix.
 */
export const getChapErrorMessage = (error: MaybeApiError) => (
    isUnauthorizedError(error)
        ? i18n.t('The CHAP server refused the request. An administrator can check the API token under Settings, in the route configuration.')
        : error?.message || i18n.t('An unknown error occurred')
);

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
