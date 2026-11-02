/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Binary metrics for one alert level.
 */
export type LevelOutbreakMetrics = {
    /**
     * Name of the alert level.
     */
    level: string;
    /**
     * Value per binary metric id. `null` where undefined, e.g. sensitivity when no cell was an outbreak.
     */
    metrics: Record<string, (number | null)>;
};

