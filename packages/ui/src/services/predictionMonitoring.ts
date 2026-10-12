import { OpenAPI } from '../httpfunctions/core/OpenAPI';
import { request } from '../httpfunctions/core/request';

// Adapter for chap-core PR #693 until this endpoint is in the generated client.
export type PredictionSetupMonitoring = {
    metricId: string;
    evaluationValue: number | null;
    points: {
        period: string;
        source: 'evaluation' | 'prediction';
        value: number;
        runningValue: number;
        nObserved: number;
    }[];
};

export const getPredictionSetupMonitoring = (predictionSetupId: number, metric: string) =>
    request<PredictionSetupMonitoring>(OpenAPI, {
        method: 'GET',
        url: '/v1/crud/prediction-setups/{prediction_setup_id}/monitoring',
        path: { prediction_setup_id: predictionSetupId },
        query: { metric },
    });
