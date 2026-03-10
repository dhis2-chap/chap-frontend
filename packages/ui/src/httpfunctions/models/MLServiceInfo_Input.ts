/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModelMetadata } from './ModelMetadata';
import type { PeriodType_Input } from './PeriodType_Input';
/**
 * ML service information extending base ServiceInfo with model-specific fields.
 */
export type MLServiceInfo_Input = {
    /**
     * Unique service identifier (slug format)
     */
    id: string;
    display_name: string;
    version?: string;
    description?: (string | null);
    model_metadata: ModelMetadata;
    period_type: PeriodType_Input;
    min_prediction_periods?: number;
    max_prediction_periods?: number;
    allow_free_additional_continuous_covariates?: boolean;
    required_covariates?: Array<string>;
    requires_geo?: boolean;
};

