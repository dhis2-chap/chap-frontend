import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export type ThresholdRequest = {
    datasetId: number;
    periodIds: string[];
    strategy: string;
    locations?: string[];
    params?: Record<string, unknown>;
};

export type ThresholdEntry = {
    period: string;
    location: string;
    value: number | null;
};

export type ThresholdStrategyInfo = {
    id: string;
    displayName: string;
    description: string;
};

export class ThresholdsService {
    /**
     * Get Endemic Thresholds
     * Compute thresholds for the given dataset, periods, and strategy.
     * @param requestBody
     * @returns ThresholdEntry[] Successful Response
     * @throws ApiError
     */
    public static getThresholdsV1AnalyticsThresholdsPost(
        requestBody: ThresholdRequest,
    ): CancelablePromise<Array<ThresholdEntry>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/analytics/thresholds',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: 'Unknown strategy or dataset',
                422: 'Validation Error',
            },
        });
    }

    /**
     * List Threshold Strategies
     * Return available threshold strategies for a strategy picker.
     * @returns ThresholdStrategyInfo[] Successful Response
     */
    public static getThresholdStrategiesV1AnalyticsThresholdsStrategiesGet(): CancelablePromise<Array<ThresholdStrategyInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/analytics/thresholds/strategies',
        });
    }
}
