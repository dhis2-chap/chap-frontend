import type { ApiError } from '@dhis2-chap/ui';
import type { ImportSummaryCorrected } from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

/**
 * Normalizes the import summary from API error responses (4XX).
 * The only snake_case field in error responses is `imported_count`, which is mapped to `importedCount`.
 * All other fields (featureName, orgUnit, timePeriods, reason) are already camelCase.
 */
export const normalizeImportSummary = (
    value: unknown,
    hash?: string,
): ImportSummaryCorrected | null => {
    if (!isRecord(value)) {
        return null;
    }

    const rejected = value.rejected;
    if (!Array.isArray(rejected) || !rejected.every(item => (
        isRecord(item) &&
        typeof item.reason === 'string' &&
        typeof item.featureName === 'string' &&
        typeof item.orgUnit === 'string' &&
        (item.timePeriods === undefined || (
            Array.isArray(item.timePeriods) && item.timePeriods.every(period => typeof period === 'string')
        ))
    ))) {
        return null;
    }

    const importedCount = value.imported_count ?? value.importedCount;
    if (typeof importedCount !== 'number') {
        return null;
    }

    return {
        id: value.id ?? null,
        importedCount,
        hash,
        rejected,
    } as ImportSummaryCorrected;
};

export const getImportSummaryFromApiError = (
    error: ApiError,
    hash?: string,
): ImportSummaryCorrected | null => normalizeImportSummary(error.body?.detail, hash);
