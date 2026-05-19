/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HorizonFeatureImportance } from './HorizonFeatureImportance';
export type HorizonStepSummary = {
    period: string;
    targetPeriod: string;
    forecastStep: number;
    featureImportances: Array<HorizonFeatureImportance>;
    actualPrediction?: (number | null);
};

