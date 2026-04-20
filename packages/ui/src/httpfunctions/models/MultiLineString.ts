/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Position2D } from './Position2D';
import type { Position3D } from './Position3D';
/**
 * MultiLineString Model
 */
export type MultiLineString = {
    bbox?: (any[] | null);
    type: string;
    coordinates: Array<Array<(Position2D | Position3D)>>;
};

