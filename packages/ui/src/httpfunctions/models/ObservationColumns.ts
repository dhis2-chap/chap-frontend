/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Observations in wide, columnar form: position ``i`` of every list together makes one (org unit, period) row.
 *
 * Much smaller and faster to read than one object per observation, for facility-level datasets.
 */
export type ObservationColumns = {
    /**
     * Org unit of each row.
     */
    orgUnit: Array<string>;
    /**
     * Period of each row, e.g. `2024W12` or `202403`.
     */
    period: Array<string>;
    /**
     * Feature name to one value per row, in row order. `null` marks a missing value.
     */
    values: Record<string, Array<(number | null)>>;
};
