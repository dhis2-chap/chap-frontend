/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeatureCollectionModel } from './FeatureCollectionModel';
import type { ObservationBase } from './ObservationBase';
export type RunPredictionSetupRequest = {
    name: string;
    geojson: FeatureCollectionModel;
    providedData: Array<ObservationBase>;
    type?: (string | null);
    nPeriods?: number;
};

