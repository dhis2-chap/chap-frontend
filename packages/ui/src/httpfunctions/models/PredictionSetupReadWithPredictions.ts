/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSource } from './DataSource';
import type { PredictionInfo } from './PredictionInfo';
import type { QuantileTarget } from './QuantileTarget';
/**
 * `PredictionSetupRead` augmented with the list of predictions the setup has produced so far.
 */
export type PredictionSetupReadWithPredictions = {
    /**
     * Primary key of the setup.
     */
    id: number;
    /**
     * Human-friendly name for the setup.
     */
    name: string;
    /**
     * Server-side timestamp when the setup was created.
     */
    created: (string | null);
    /**
     * Foreign key to the parent `Backtest`.
     */
    backtestId: number;
    /**
     * Configured model the setup will run.
     */
    configuredModel: ConfiguredModelRead;
    /**
     * Period the recurring run starts forecasting from; `None` means run-time default.
     */
    startPeriod: (string | null);
    /**
     * Identifiers of the org units the setup forecasts for.
     */
    orgUnits: Array<string>;
    /**
     * Mapping of covariate names to data element ids used to source the inputs.
     */
    covariateSources: Array<DataSource>;
    /**
     * Granularity of the forecast periods (`month`, `week`, ...).
     */
    periodType: (string | null);
    /**
     * Standard cron expression for when the setup runs; `None` means manual-only.
     */
    scheduleCronExpression: (string | null);
    /**
     * When True, the scheduler executes the setup at every cron tick.
     */
    scheduleEnabled: boolean;
    /**
     * Where to push each quantile of the predictive distribution.
     */
    quantileTargets: Array<QuantileTarget>;
    /**
     * Predictions produced by this setup so far, summary view only.
     */
    predictions?: Array<PredictionInfo>;
};

