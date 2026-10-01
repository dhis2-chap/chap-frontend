/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertApproval } from './AlertApproval';
/**
 * Request body for moving a set of alerts through the release gate.
 */
export type AlertApprovalRequest = {
    /**
     * Alerts to review, applied together.
     */
    alertIds: Array<number>;
    /**
     * New gate state. `approved` clears the alerts for dissemination; `declined` records a deliberate decision not to release them, so they do not return to the queue.
     */
    approved: AlertApproval;
    /**
     * Identifier of whoever reviewed them.
     */
    approvedBy: string;
};

