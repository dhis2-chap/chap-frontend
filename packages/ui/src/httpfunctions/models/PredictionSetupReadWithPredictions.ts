/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelWithDataSourceRead } from './ConfiguredModelWithDataSourceRead';
import type { DataImportMapping } from './DataImportMapping';
import type { PredictionInfo } from './PredictionInfo';
import type { PredictionSchedule } from './PredictionSchedule';
export type PredictionSetupReadWithPredictions = {
    id: number;
    name: string;
    created: (string | null);
    configuredModelWithDataSource: ConfiguredModelWithDataSourceRead;
    schedule: PredictionSchedule;
    dataImportMappings: Array<DataImportMapping>;
    archived?: boolean;
    predictions?: Array<PredictionInfo>;
};

