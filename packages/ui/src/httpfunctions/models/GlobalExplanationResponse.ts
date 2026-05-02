/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeatureAttribution } from './FeatureAttribution';
import type { SurrogateQualityRead } from './SurrogateQualityRead';
export type GlobalExplanationResponse = {
    method: string;
    topFeatures: Array<FeatureAttribution>;
    computedAt?: (string | null);
    nSamples?: number;
    stabilityScore?: (number | null);
    available?: boolean;
    surrogateQuality?: (SurrogateQualityRead | null);
};

