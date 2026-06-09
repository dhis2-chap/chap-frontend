/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * The set of org units + split periods a backtest covers — used by the UI to filter visualisations.
 */
export type BacktestDomain = {
    /**
     * Identifiers of every org unit the backtest scored predictions over.
     */
    orgUnits: Array<string>;
    /**
     * Periods at which the rolling backtest's train/test split was advanced.
     */
    splitPeriods: Array<string>;
};

