/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuantileTarget } from './QuantileTarget';
/**
 * Request body for creating a recurring prediction setup attached to a backtest.
 */
export type PredictionSetupCreate = {
    /**
     * Foreign key to the parent `Backtest` the setup will run forward in time.
     */
    backtestId: number;
    /**
     * Human-friendly name for the setup.
     */
    name: string;
    /**
     * Standard cron expression for when to run; `None` means manual-only.
     */
    scheduleCronExpression?: (string | null);
    /**
     * When True, the scheduler executes the setup at every cron tick.
     */
    scheduleEnabled?: boolean;
    /**
     * Where to push each quantile of the predictive distribution.
     */
    quantileTargets?: Array<QuantileTarget>;
};

