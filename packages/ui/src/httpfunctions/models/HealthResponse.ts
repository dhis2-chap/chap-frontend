/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Liveness check response indicating the API process is reachable.
 */
export type HealthResponse = {
    /**
     * Always `success` when the API is reachable.
     */
    status: string;
    /**
     * Human-readable status message.
     */
    message: string;
};

