/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OptimizationDirection } from './OptimizationDirection';
import type { TargetBehavior } from './TargetBehavior';
/**
 * Catalogue entry for one scoring metric (CRPS, MAE, ...).
 */
export type MetricInfo = {
    /**
     * Canonical metric identifier used in URLs and request bodies.
     */
    id: string;
    /**
     * Human-friendly metric name shown in pickers.
     */
    displayName: string;
    /**
     * Short paragraph explaining what the metric measures.
     */
    description?: string;
    /**
     * Display suffix for the raw score, e.g. '%' for MAPE.
     */
    unit?: (string | null);
    /**
     * Ideal value in raw score units, e.g. 0.8 for 80% coverage. Null when no fixed target applies.
     */
    target?: (number | null);
    /**
     * How to judge a score against ``target``, only meaningful when ``target`` is set. 'closest' means deviating in either direction is worse. 'at_least' means higher is better up to the target and flat above it, so only scores below the target should be flagged as bad.
     */
    targetBehavior?: TargetBehavior;
    /**
     * Whether a lower ('minimize') or higher ('maximize') score is better. Null for metrics where neither direction is better; those set ``target`` instead, and ``target_behavior`` says how to judge a score against it.
     */
    optimizationDirection?: (OptimizationDirection | null);
};

