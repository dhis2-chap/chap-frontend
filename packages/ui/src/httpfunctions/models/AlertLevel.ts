/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PercentileParams } from './PercentileParams';
import type { SeasonalParams } from './SeasonalParams';
/**
 * One tier of an :class:`AlertPolicy`.
 *
 * Stored inside the policy's JSON column, never as a row of its own.
 */
export type AlertLevel = {
    /**
     * Name of the tier, e.g. `monitor`, `alert` or `action`. Unique within a policy.
     */
    name: string;
    /**
     * Parameters for the epidemic channel this tier is judged against. Its `type` selects the threshold strategy, exactly as in `POST /v1/analytics/thresholds`. Must describe a single threshold line, so it is unambiguous which line the tier is judged against.
     */
    thresholdParams: (SeasonalParams | PercentileParams);
    /**
     * Probability of breaching the channel at or above which this tier fires. `0.5` means the tier fires when at least half the forecast mass sits above the channel.
     */
    exceedanceThreshold: number;
};

