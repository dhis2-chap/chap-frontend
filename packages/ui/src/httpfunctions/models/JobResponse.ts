/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response returned from any endpoint that enqueues background work.
 */
export type JobResponse = {
    /**
     * Identifier of the queued job; use it to poll status via the jobs endpoints.
     */
    id: string;
};

