import type { ImportSummaryResponse } from '@dhis2-chap/ui';

// This is a workaround to get the correct type for the rejected field - the openapi spec is incorrect
export type ImportSummaryCorrected = Omit<ImportSummaryResponse, 'rejected'> & {
    hash?: string;
    rejected: {
        featureName: string;
        orgUnit: string;
        reason: string;
        period: string[];
    }[];
    orgUnitsWithoutGeometry?: { id: string; displayName: string }[];
};
