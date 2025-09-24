/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * This class has been used when computing metrics per location/time_point/split_point adhoc
 * in database.py. This id depcrecated and not used in the new metric system.
 * Can be removed when no references left to this class.
 */
export type BackTestMetric = {
    id?: (number | null);
    backtestId: number;
    metricId: string;
    period: string;
    orgUnit: string;
    lastTrainPeriod: string;
    lastSeenPeriod: string;
    value: number;
};

