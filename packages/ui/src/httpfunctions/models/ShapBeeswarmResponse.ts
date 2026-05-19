/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ShapBeeswarmPoint } from './ShapBeeswarmPoint';
import type { SurrogateQualityRead } from './SurrogateQualityRead';
export type ShapBeeswarmResponse = {
    predictionId: number;
    outputStatistic: string;
    featureNames: Array<string>;
    points: Array<ShapBeeswarmPoint>;
    surrogateQuality?: (SurrogateQualityRead | null);
};

