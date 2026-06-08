/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSource } from './DataSource';
import type { FeatureCollectionModel } from './FeatureCollectionModel';
import type { FetchRequest } from './FetchRequest';
import type { ObservationBase } from './ObservationBase';
/**
 * Long-path request: build the dataset, then immediately backtest the configured model against it.
 */
export type MakeBacktestWithDataRequest = {
    /**
     * Number of periods to forecast at each split.
     */
    nPeriods?: number;
    /**
     * Total number of rolling train/test splits.
     */
    nSplits?: number;
    /**
     * Number of periods to advance between successive splits.
     */
    stride?: number;
    /**
     * Number of times the model is retrained, evenly spaced across the splits. 1 means train once.
     */
    nRetrain?: number;
    /**
     * Human-friendly name for the resulting backtest row.
     */
    name: string;
    /**
     * A mapping of covariate names to data element IDs from which to source the data
     */
    dataSources?: (Array<DataSource> | null);
    /**
     * Purpose of dataset, e.g., 'forecasting' or 'backtesting'
     */
    type?: (string | null);
    /**
     * GeoJSON polygon set for the dataset's org units.
     */
    geojson: FeatureCollectionModel;
    /**
     * Observations the caller is supplying directly.
     */
    providedData: Array<ObservationBase>;
    /**
     * Features whose observations the server should fetch from a registered source.
     */
    dataToBeFetched: Array<FetchRequest>;
    /**
     * Canonical name of the configured model to backtest.
     */
    modelId: string;
};

