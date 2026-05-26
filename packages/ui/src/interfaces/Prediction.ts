import { PredictionInfo } from '../httpfunctions';

// New, normalized view-models for predictions
export type QuantileKey = 'quantile_low' | 'quantile_mid_low' | 'median' | 'quantile_mid_high' | 'quantile_high';

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
    actualCases?: Array<{ period: string; value: number | null }>;
}

// Re-export type for convenience in downstream apps
export type { PredictionInfo };
