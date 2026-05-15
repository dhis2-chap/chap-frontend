/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Position2D } from './Position2D';
import type { Position3D } from './Position3D';
/**
 * Point Model
 */
export type Point = {
    bbox?: (any[] | null);
    type: string;
    coordinates: (Position2D | Position3D);
};

