/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertLevel } from './AlertLevel';
/**
 * Request body for creating an alert policy.
 *
 * Redeclares `levels` as required with at least one entry, so an empty ladder is
 * a schema error rather than something the service has to catch.
 */
export type AlertPolicyCreate = {
    /**
     * Human-friendly name for the policy.
     */
    name: string;
    /**
     * Output code for the no-alert state. Must be non-empty and distinct from every level's code. For DHIS2 import, it must match the destination data element's value type or option set.
     */
    noAlertOutputCode?: string;
    /**
     * The tiers of this policy, e.g. a `monitor` level and an `action` level. Names must be unique within a policy. Omitted output codes default to `1`, `2`, etc. in level order.
     */
    levels: Array<AlertLevel>;
};

