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
    orgUnitsWithoutGeometry?: string[];
};

export class NoValidOrgUnitsError extends Error {
    constructor(message: string = 'No valid organization units with geometry') {
        super(message);
        this.name = 'NoValidOrgUnitsError';
    }
}
