/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertLevel } from './AlertLevel';
/**
 * API read shape for an `AlertPolicy`.
 */
export type AlertPolicyRead = {
    /**
     * Human-friendly name for the policy.
     */
    name: string;
    /**
     * Output code for the no-alert state. Must be non-empty and distinct from every level's code. For DHIS2 import, it must match the destination data element's value type or option set.
     */
    noAlertOutputCode?: string;
    /**
     * The tiers of this policy, ordered from least to most severe.
     */
    levels?: Array<AlertLevel>;
    /**
     * Primary key of the policy.
     */
    id: number;
    /**
     * Server-side timestamp when the policy was created.
     */
    created: (string | null);
};

