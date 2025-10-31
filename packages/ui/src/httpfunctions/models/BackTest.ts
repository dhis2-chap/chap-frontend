/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BackTest = {
    datasetId: number;
    modelId: string;
    name?: (string | null);
    created?: (string | null);
    modelTemplateVersion?: (string | null);
    id?: (number | null);
    orgUnits?: Array<string>;
    splitPeriods?: Array<string>;
    aggregateMetrics?: Record<string, number>;
    modelDbId: number;
};

