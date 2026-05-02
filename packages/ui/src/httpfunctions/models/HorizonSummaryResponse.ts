/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AverageImportance } from './AverageImportance';
import type { HorizonStepSummary } from './HorizonStepSummary';
export type HorizonSummaryResponse = {
    predictionId: number;
    orgUnit: string;
    method: string;
    outputStatistic: string;
    steps: Array<HorizonStepSummary>;
    averageImportance: Array<AverageImportance>;
    surrogateQuality?: (Record<string, any> | null);
};

