/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One alert to record.
 *
 * Exactly :class:`~chap_core.database.alert_tables.AlertBase`: the release-gate
 * fields are deliberately not settable, so every alert starts in `pending`.
 */
export type AlertCreate = {
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
};

