/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Position2D } from './Position2D';
import type { Position3D } from './Position3D';
/**
 * MultiPoint Model
 */
export type MultiPoint = {
    bbox?: (any[] | null);
    type: string;
    coordinates: Array<(Position2D | Position3D)>;
};

