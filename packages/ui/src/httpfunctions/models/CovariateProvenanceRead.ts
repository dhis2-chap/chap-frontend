/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Provenance of the covariate row used for a single forecast instance.
 *
 * Fields other than ``source`` and ``detail`` are variant-specific:
 * only the fields relevant to ``source`` are populated.
 */
export type CovariateProvenanceRead = {
    source: CovariateProvenanceRead.source;
    detail: string;
    matchedPeriod?: (string | null);
    aggregate?: (string | null);
    targetYear?: (number | null);
    calendarMonth?: (number | null);
    isoWeek?: (number | null);
    nRowsAveraged?: (number | null);
    yearsUsed?: (Array<number> | null);
};
export namespace CovariateProvenanceRead {
    export enum source {
        DATASET_MATCH = 'dataset_match',
        LAST_AVAILABLE_ROW = 'last_available_row',
        HISTORICAL_SAME_MONTH_MEAN = 'historical_same_month_mean',
        HISTORICAL_SAME_WEEK_MEAN = 'historical_same_week_mean',
    }
}

