/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DiagnosticLogs = {
    /**
     * Last 256 KiB of captured output, plus a truncation marker when needed. Model output may contain data values; it is not sanitized.
     */
    tail: string;
    truncated: boolean;
};

