/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LevelOutbreakMetrics } from './LevelOutbreakMetrics';
/**
 * Outbreak metrics for one group of cells.
 */
export type OutbreakMetricsRow = {
    /**
     * Location of the group; `null` unless grouped by it.
     */
    location?: (string | null);
    /**
     * Period of the group; `null` unless grouped by it.
     */
    timePeriod?: (string | null);
    /**
     * Horizon of the group; `null` unless grouped by it.
     */
    horizonDistance?: (number | null);
    /**
     * Number of (location, period, horizon) cells scored.
     */
    nCells: number;
    /**
     * One entry per policy level, least to most severe.
     */
    levels: Array<LevelOutbreakMetrics>;
    /**
     * Value per categorical metric id, judging the most severe level breached. `null` where undefined.
     */
    categorical: Record<string, (number | null)>;
};

