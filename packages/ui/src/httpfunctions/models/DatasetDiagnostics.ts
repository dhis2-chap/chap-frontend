/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DatasetDiagnostics = {
    n_locations: number;
    period_type: (string | null);
    first_period: (string | null);
    last_period: (string | null);
    covariates: Array<string>;
    /**
     * Number of stored NULL or NaN observations per feature.
     */
    missing_value_counts: Record<string, number>;
};

