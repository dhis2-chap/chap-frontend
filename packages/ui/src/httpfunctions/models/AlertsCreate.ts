/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AlertCreate } from './AlertCreate';
/**
 * Request body for recording a batch of alerts. One run raises many at once.
 */
export type AlertsCreate = {
    /**
     * The alerts to record.
     */
    alerts: Array<AlertCreate>;
};

