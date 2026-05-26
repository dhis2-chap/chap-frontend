/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * System information response.
 */
export type SystemInfoResponse = {
    /**
     * Installed `chap_core` package version.
     */
    chap_core_version: string;
    /**
     * Python runtime version of the API process.
     */
    python_version: string;
    /**
     * Current server time as an ISO-8601 UTC string.
     */
    server_date: string;
    /**
     * Server timezone identifier (always `Etc/UTC`).
     */
    server_time_zone_id: string;
    /**
     * Git revision the running image was built from (empty if unknown).
     */
    revision: string;
};

