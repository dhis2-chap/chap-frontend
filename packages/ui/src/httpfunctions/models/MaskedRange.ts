/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * An inclusive range of periods in which `disease_cases` is hidden from models (CLIM-1300).
 *
 * Both bounds are normalised to canonical period ids on creation, so `2021-6` and `202106` are stored
 * as `202106`, and `2021W1` as `2021W01`.
 */
export type MaskedRange = {
    /**
     * First masked period, a month or week id (e.g. `202106` or `2021W01`).
     */
    start: string;
    /**
     * Last masked period, inclusive, of the same period type as `start`.
     */
    end: string;
    /**
     * Optional label for the range, such as `covid`.
     */
    name?: (string | null);
};

