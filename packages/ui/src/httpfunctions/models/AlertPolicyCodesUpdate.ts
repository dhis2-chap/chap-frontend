/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Change output codes and response actions without changing the policy's ladder.
 */
export type AlertPolicyCodesUpdate = {
    /**
     * New output codes keyed by existing level name. Omitted levels keep their codes.
     */
    levelOutputCodes?: Record<string, string>;
    /**
     * Response actions keyed by existing level name. Omitted levels keep their actions; null clears an action. Existing alerts use the updated text.
     */
    levelResponseActions?: Record<string, (string | null)>;
    /**
     * New no-alert output code; omitted or null leaves it unchanged.
     */
    noAlertOutputCode?: (string | null);
};

