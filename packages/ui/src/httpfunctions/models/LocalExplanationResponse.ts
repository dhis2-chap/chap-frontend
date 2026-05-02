/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeatureAttribution } from './FeatureAttribution';
export type LocalExplanationResponse = {
    id?: (number | null);
    predictionId: number;
    orgUnit: string;
    period: string;
    method: string;
    outputStatistic: string;
    featureAttributions: Array<FeatureAttribution>;
    baselinePrediction: number;
    actualPrediction: number;
    computedAt?: (string | null);
    status?: string;
    surrogateQuality?: (Record<string, any> | null);
    covariateProvenance?: (Record<string, any> | null);
};

