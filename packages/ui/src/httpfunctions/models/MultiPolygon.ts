/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Position2D } from './Position2D';
import type { Position3D } from './Position3D';
/**
 * MultiPolygon Model
 */
export type MultiPolygon = {
    bbox?: (any[] | null);
    type: string;
    coordinates: Array<Array<Array<(Position2D | Position3D)>>>;
};

