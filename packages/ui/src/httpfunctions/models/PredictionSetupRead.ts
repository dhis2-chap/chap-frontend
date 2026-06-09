/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSource } from './DataSource';
import type { QuantileTarget } from './QuantileTarget';
/**
 * API read shape for a `PredictionSetup`. Same fields as the DB row but with the configured-model joined.
 */
export type PredictionSetupRead = {
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
};

