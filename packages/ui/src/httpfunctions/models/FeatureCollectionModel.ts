/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeatureModel } from './FeatureModel';
/**
 * GeoJSON `FeatureCollection` of `FeatureModel`s — the polygon set for a dataset.
 */
export type FeatureCollectionModel = {
    bbox?: (any[] | null);
    type: string;
    /**
     * One feature per org unit in the polygon set.
     */
    features: Array<FeatureModel>;
};

