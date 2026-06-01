/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ValidationError } from './ValidationError';
/**
 * Result of a dataset import: how many rows landed, how many were rejected, and why.
 */
export type ImportSummaryResponse = {
    /**
     * Identifier of the imported dataset; `None` if the import was rejected outright.
     */
    id: (string | null);
    /**
     * Number of observations that were successfully imported.
     */
    importedCount: number;
    /**
     * One row per rejected observation, with the reason.
     */
    rejected: Array<ValidationError>;
};

