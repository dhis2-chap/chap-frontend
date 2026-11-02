/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { SpecificationBaselineStatus } from './SpecificationBaselineStatus';
/**
 * A baseline or comparison model's result on a specification, the reference other backtests are compared with.
 */
export type ReferenceModelResult = {
    /**
     * The reference model.
     */
    configuredModel: ConfiguredModelRead;
    /**
     * `done` once the model's backtest is stored. A baseline is `pending` until it has run, `not_applicable` if it rejects the specification's data, and `failed` if its run failed.
     */
    status: SpecificationBaselineStatus;
    /**
     * Why the baseline is not applicable or failed.
     */
    message?: (string | null);
    /**
     * Id of the model's backtest once it is done.
     */
    backtestId?: (number | null);
    /**
     * Map of metric id to aggregated score; empty until the model is done.
     */
    aggregateMetrics?: Record<string, number>;
};

