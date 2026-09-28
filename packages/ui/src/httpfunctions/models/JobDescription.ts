/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Public job metadata surfaced by the `/v1/jobs` endpoints — what the UI shows in a job list.
 */
export type JobDescription = {
    /**
     * Identifier of the job (matches the underlying Celery task id).
     */
    id: string;
    /**
     * Canonical job-type string from `JobType` (e.g. `create_backtest`, `create_prediction`).
     */
    type: string;
    /**
     * Human-friendly name for the job, set by the caller at enqueue time.
     */
    name: string;
    /**
     * Current job status (`PENDING`, `STARTED`, `SUCCESS`, `FAILURE`, ...).
     */
    status: string;
    /**
     * ISO timestamp when the job started running; `None` while still queued.
     */
    start_time: (string | null);
    /**
     * ISO timestamp when the job completed; `None` while still running.
     */
    end_time: (string | null);
    /**
     * Result blob produced by the job (JSON string) or error message on failure.
     */
    result: (string | null);
    /**
     * `PredictionSetup.id` this job belongs to, when applicable.
     */
    prediction_setup_id?: (number | null);
};

