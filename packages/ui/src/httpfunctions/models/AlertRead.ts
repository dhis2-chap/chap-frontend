/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertApproval } from './AlertApproval';
/**
 * API read shape for an `Alert`.
 *
 * Carries the policy's id rather than the policy itself: a listing is usually long
 * and the caller already has the policies.
 */
export type AlertRead = {
    /**
     * Period the alert is about, e.g. `2024-07`.
     */
    timePeriod: string;
    /**
     * Identifier of the org unit the alert is for.
     */
    orgUnit: string;
    /**
     * Foreign key to the `AlertPolicy` whose level was breached.
     */
    alertPolicyId: number;
    /**
     * Name of the `AlertLevel` that fired, e.g. `monitor` or `action`. Always one of the names on the referenced policy.
     */
    level: string;
    /**
     * Foreign key to the `Prediction` whose forecast raised the alert; `None` if it was recorded without a linked run. Deleting a prediction that raised alerts is refused, so an alert is never separated from the forecast that justified it.
     */
    predictionId?: (number | null);
    /**
     * Server-side timestamp when the alert was recorded.
     */
    created?: (string | null);
    /**
     * Where the alert stands in the release gate. Cleared for dissemination only when `approved`; says nothing about whether the outbreak was real.
     */
    approved?: AlertApproval;
    /**
     * Caller-supplied identifier of whoever reviewed it; `None` while pending.
     */
    approvedBy?: (string | null);
    /**
     * Server-side timestamp of the review; `None` while pending.
     */
    approvedAt?: (string | null);
    /**
     * Primary key of the alert.
     */
    id: number;
};

