export const isDhis2NotFound = (error: unknown): boolean => {
    if (!error || typeof error !== 'object' || !('details' in error)) {
        return false;
    }

    const details = (error as { details?: { httpStatusCode?: number } }).details;
    return details?.httpStatusCode === 404;
};
