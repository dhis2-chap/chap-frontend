/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataImportMapping } from './DataImportMapping';
import type { PredictionSchedule } from './PredictionSchedule';
export type PredictionSetupCreate = {
    backtestId: number;
    name: string;
    schedule?: (PredictionSchedule | null);
    dataImportMappings?: Array<DataImportMapping>;
};

