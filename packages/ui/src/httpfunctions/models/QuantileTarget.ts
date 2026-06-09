/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A `(quantile, data_element_id)` pair declaring where to push a quantile of the predictive distribution.
 *
 * Used inside `PredictionSetup.quantile_targets` to tell the scheduled run
 * which DHIS2 data element receives which quantile (e.g. median → element
 * A, 90th-percentile → element B).
 */
export type QuantileTarget = {
    /**
     * Quantile as a numeric string (`'0.5'` for median, `'0.9'` for the 90th percentile, ...).
     */
    quantile: string;
    /**
     * External data element id the quantile value is pushed to.
     */
    dataElementId: string;
};

