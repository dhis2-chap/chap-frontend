/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataImportMapping } from './DataImportMapping';
import type { PredictionSchedule } from './PredictionSchedule';
export type PredictionSetupUpdate = {
    name?: (string | null);
    schedule?: (PredictionSchedule | null);
    dataImportMappings?: (Array<DataImportMapping> | null);
};

