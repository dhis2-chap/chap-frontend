/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Where an alert stands in the release gate.
 *
 * This is about dissemination, not epidemiology: it records whether a human has
 * cleared the alert to go out to recipients, and says nothing about whether the
 * outbreak turned out to be real.
 */
export enum AlertApproval {
    PENDING = 'pending',
    APPROVED = 'approved',
    DECLINED = 'declined',
}
