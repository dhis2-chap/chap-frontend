/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredModelRead } from './ConfiguredModelRead';
import type { DataSource } from './DataSource';
import type { PredictionInfo } from './PredictionInfo';
import type { QuantileTarget } from './QuantileTarget';
export type PredictionSetupReadWithPredictions = {
    id: number;
    name: string;
    created: (string | null);
    backtestId: number;
    configuredModel: ConfiguredModelRead;
    startPeriod: (string | null);
    orgUnits: Array<string>;
    covariateSources: Array<DataSource>;
    periodType: (string | null);
    scheduleCronExpression: (string | null);
    scheduleEnabled: boolean;
    quantileTargets: Array<QuantileTarget>;
    predictions?: Array<PredictionInfo>;
};

