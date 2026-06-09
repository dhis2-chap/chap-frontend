/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataElement } from './DataElement';
/**
 * Time-series of v1-format `DataElement`s for one feature on one DHIS2 data element.
 */
export type DataList = {
    /**
     * Canonical feature identifier (matching a `FeatureType.name`).
     */
    featureId: string;
    /**
     * External DHIS2 data element id the values came from.
     */
    dhis2Id: string;
    /**
     * At least one (period, org-unit, value) row.
     */
    data: Array<DataElement>;
};

