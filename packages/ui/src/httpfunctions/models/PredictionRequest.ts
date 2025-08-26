/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataList } from './DataList';
import type { FeatureCollectionModel } from './FeatureCollectionModel';
export type PredictionRequest = {
    orgUnitsGeoJson: FeatureCollectionModel;
    features: Array<DataList>;
    estimator_id?: string;
    n_periods?: number;
    include_data?: boolean;
};

