/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuantileTarget } from './QuantileTarget';
export type PredictionSetupUpdate = {
    name?: (string | null);
    scheduleCronExpression?: (string | null);
    scheduleEnabled?: (boolean | null);
    quantileTargets?: (Array<QuantileTarget> | null);
};

