/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request body for creating a backtest row directly (DB-level — typically the long path goes via `MakeBacktestRequest`).
 */
export type BacktestCreate = {
    /**
     * Foreign key to the `DataSet` the backtest evaluates against.
     */
    datasetId: number;
    /**
     * Configured model to backtest: either the integer primary key or the canonical string name.
     */
    modelId: (number | string);
    /**
     * Optional human-friendly name for the backtest.
     */
    name?: (string | null);
    /**
     * Server-side timestamp when the backtest row was created.
     */
    created?: (string | null);
    /**
     * Snapshot of the parent template's version at backtest-creation time (may differ from current template version).
     */
    modelTemplateVersion?: (string | null);
};

