import { FullPredictionResponse, PredictionResponse, PredictionInfo } from '../httpfunctions';

export interface FullPredictionResponseExtended extends FullPredictionResponse {
    diseaseId: string;
    dataValues: Array<PredictionResponseExtended>;
}

export interface PredictionResponseExtended extends PredictionResponse {
    displayName: string;
}

// New, normalized view-models for predictions
export type QuantileKey = 'quantile_low' | 'median' | 'quantile_high';

export interface PredictionPointVM {
    period: string;
    periodLabel: string;
    quantiles: Record<QuantileKey, number>;
}

export interface PredictionOrgUnitSeries {
    targetId: string;
    orgUnitId: string;
    orgUnitName: string;
    points: PredictionPointVM[];
}

// Re-export type for convenience in downstream apps
export type { PredictionInfo };
