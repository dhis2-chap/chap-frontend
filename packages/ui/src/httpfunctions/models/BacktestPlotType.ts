/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Catalogue entry for one backtest-level plot style (per-metric, per-org-unit, ...).
 */
export type BacktestPlotType = {
    /**
     * Canonical plot identifier used in URLs.
     */
    id: string;
    /**
     * Human-friendly plot name shown in pickers.
     */
    displayName: string;
    /**
     * Short paragraph explaining what the plot shows.
     */
    description?: string;
};

