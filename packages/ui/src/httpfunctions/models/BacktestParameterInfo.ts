/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Default value and display metadata for one backtest parameter.
 */
export type BacktestParameterInfo = {
    /**
     * CamelCase parameter name used in request bodies.
     */
    name: string;
    /**
     * Human-friendly label shown in forms.
     */
    label: string;
    /**
     * Short help text for the parameter.
     */
    description: string;
    /**
     * Value used when the parameter is omitted.
     */
    default: (number | string);
    /**
     * JSON Schema type of the parameter.
     */
    type: string;
    /**
     * Inclusive lower bound, when applicable.
     */
    minimum?: (number | null);
};

