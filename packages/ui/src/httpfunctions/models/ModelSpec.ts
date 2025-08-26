/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Feature } from './Feature';
import type { PeriodType } from './PeriodType';
export type ModelSpec = {
    name: string;
    parameters: Record<string, any>;
    features: Array<Feature>;
    period?: PeriodType;
    description?: string;
    author?: string;
    targets?: string;
};

