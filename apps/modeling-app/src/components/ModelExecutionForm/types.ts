import type { ImportSummaryResponse } from '@dhis2-chap/ui';

// This is a workaround to get the correct type for the rejected field - the openapi spec is incorrect
export type ImportSummaryCorrected = Omit<ImportSummaryResponse, 'rejected'> & {
    hash?: string;
    imported_count?: number;
    rejected: {
        featureName: string;
        orgUnit: string;
        reason: string;
        timePeriods?: string[];
    }[];
};
