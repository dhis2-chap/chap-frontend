/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthResponse } from '../models/HealthResponse';
import type { ReadinessResponse } from '../models/ReadinessResponse';
import type { SystemInfoResponse } from '../models/SystemInfoResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemService {
    /**
     * Liveness probe
     * Cheap liveness check that returns immediately if the API process is reachable. Does not verify downstream dependencies — use `/health/ready` for that.
     * @returns HealthResponse API process is alive.
     * @throws ApiError
     */
    public static healthHealthGet(): CancelablePromise<HealthResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Readiness probe with dependency checks
     * Synchronously verifies that the required infrastructure dependencies are reachable:
     *
     * - **db**: executes `SELECT 1` against PostgreSQL.
     * - **redis**: issues a Redis `PING`.
     * - **celery**: broadcasts a worker `ping` (1s timeout) and requires at least one reply.
     *
     * Returns `200` with `status: success` when all checks pass, or `503` with `status: unhealthy` and a per-dependency `checks` map so dashboards can identify which dependency is down. Intended for use as a Kubernetes readiness probe or load balancer health check.
     * @returns ReadinessResponse All dependencies are reachable.
     * @throws ApiError
     */
    public static readinessHealthReadyGet(): CancelablePromise<ReadinessResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/ready',
            errors: {
                503: `One or more dependencies are unreachable.`,
            },
        });
    }
    /**
     * End-to-end celery + DB round-trip probe
     * Synchronously dispatches a task to a celery worker, requires the worker to run `SELECT 1` against PostgreSQL, and waits up to 2 seconds for the result to come back via the result backend. Verifies the full pipeline that `/health/ready` only checks shallowly:
     *
     * - API → broker enqueue
     * - Worker pickup and execution
     * - Worker → DB read
     * - Result backend write/read
     *
     * Slower than `/health/ready` (tens of ms when healthy, up to 2s on timeout). **Not** intended for Kubernetes readiness probes — use this from dashboards or on-demand ops checks.
     * @returns ReadinessResponse End-to-end round-trip succeeded.
     * @throws ApiError
     */
    public static deepProbeHealthProbeGet(): CancelablePromise<ReadinessResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/probe',
            errors: {
                503: `Celery round-trip failed or timed out.`,
            },
        });
    }
    /**
     * System and version information
     * Returns build/runtime metadata (CHAP version, Python version, server time, git revision).
     * @returns SystemInfoResponse Successful Response
     * @throws ApiError
     */
    public static systemInfoSystemInfoGet(): CancelablePromise<SystemInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system/info',
        });
    }
}
