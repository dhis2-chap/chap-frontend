/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Readiness check response with per-dependency status.
 */
export type ReadinessResponse = {
    /**
     * Overall readiness state. `success` if every dependency is reachable, otherwise `unhealthy`.
     */
    status: string;
    /**
     * Per-dependency status keyed by dependency name (`db`, `redis`, `celery`). Each value is `ok` on success, or `error: <reason>` on failure.
     */
    checks: Record<string, string>;
};

