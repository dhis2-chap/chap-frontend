/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BacktestJob } from './BacktestJob';
/**
 * Response of a multi-model run: where the results will land and how to follow each job.
 */
export type MakeBacktestsResponse = {
    /**
     * Id of the `BacktestSpecification` every backtest of the run files under; fetch the results with `GET /v1/crud/backtest-specifications/{id}`.
     */
    specificationId: number;
    /**
     * One queued job per requested model, in request order.
     */
    jobs: Array<BacktestJob>;
};

