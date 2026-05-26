/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuantileTarget } from './QuantileTarget';
export type PredictionSetupCreate = {
    backtestId: number;
    name: string;
    scheduleCronExpression?: (string | null);
    scheduleEnabled?: boolean;
    quantileTargets?: Array<QuantileTarget>;
};

