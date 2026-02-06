import { ApiError } from '@dhis2-chap/ui';
import { ImportSummaryCorrected } from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null
);

/**
 * This function is used to normalize the import summary response from the API.
 * It is only used on API responses that returns errors (4XX).
 * Since it's not returning the import summary but throwing an error, all properties are using the python snake_case naming convention.
 */
export const normalizeImportSummary = (
    value: unknown,
    hash?: string,
): ImportSummaryCorrected | null => {
    if (!isRecord(value)) {
        return null;
    }

    const importedCount = value.imported_count;
    const rejected = value.rejected;

    if (typeof importedCount !== 'number' || !Array.isArray(rejected)) {
        return null;
    }

    return {
        id: value.id ?? null,
        importedCount,
        hash,
        rejected: rejected.map((item: unknown) => {
            if (!isRecord(item)) {
                return item;
            }
            return {
                featureName: (item.feature_name as string) || (item.featureName as string),
                orgUnit: (item.org_unit as string) || (item.orgUnit as string),
                reason: item.reason as string,
                timePeriods: (item.time_periods as string[]) || (item.timePeriods as string[]),
            };
        }),
    } as ImportSummaryCorrected;
};

export const getImportSummaryFromApiError = (
    error: ApiError,
    hash?: string,
): ImportSummaryCorrected | null => normalizeImportSummary(error.body?.detail, hash);
