/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A single observed value for one (period, org unit, feature) triple.
 */
export type ObservationBase = {
    /**
     * Period the observation belongs to, encoded as an ISO-like string (e.g. `2024-W12`, `202403`).
     */
    period: string;
    /**
     * Identifier of the org unit (province, district, ...) the observation is from.
     */
    orgUnit: string;
    /**
     * Observed value. `None` is allowed for known-missing observations.
     */
    value: (number | null);
    /**
     * Canonical name of the `FeatureType` this observation is a value for.
     */
    featureName: (string | null);
};

