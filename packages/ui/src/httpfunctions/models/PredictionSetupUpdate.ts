/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuantileTarget } from './QuantileTarget';
/**
 * Partial-update body for an existing prediction setup. Rejects unknown fields with HTTP 422.
 */
export type PredictionSetupUpdate = {
    /**
     * New human-friendly name; `None` leaves it unchanged.
     */
    name?: (string | null);
    /**
     * New cron expression; `None` leaves it unchanged.
     */
    scheduleCronExpression?: (string | null);
    /**
     * New enabled flag; `None` leaves it unchanged.
     */
    scheduleEnabled?: (boolean | null);
    /**
     * New full quantile-targets list; `None` leaves it unchanged.
     */
    quantileTargets?: (Array<QuantileTarget> | null);
};

