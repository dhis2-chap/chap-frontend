import type { ApiError } from '@dhis2-chap/ui';

// Validation and missing-data responses contain actionable messages. Keep
// unexpected server failures on the generic fallback instead of exposing them.
export const getThresholdCalculationErrorDetail = (
    error: Pick<ApiError, 'status' | 'body'>,
): string | undefined => {
    if (![400, 404, 422].includes(error.status)) return undefined;

    const detail: unknown = error.body?.detail;
    if (typeof detail === 'string') return detail.trim() || undefined;
    if (!Array.isArray(detail)) return undefined;

    const messages = detail.flatMap((item: unknown) => {
        if (!item || typeof item !== 'object' || !('msg' in item) || typeof item.msg !== 'string') {
            return [];
        }
        return item.msg.trim() ? [item.msg.trim()] : [];
    });
    return [...new Set(messages)].join(' ') || undefined;
};
