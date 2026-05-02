/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ShapBeeswarmPoint } from './ShapBeeswarmPoint';
export type ShapBeeswarmResponse = {
    predictionId: number;
    outputStatistic: string;
    featureNames: Array<string>;
    points: Array<ShapBeeswarmPoint>;
    surrogateQuality?: (Record<string, any> | null);
};

