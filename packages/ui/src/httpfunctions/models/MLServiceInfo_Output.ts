/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { chap_core__rest_api__services__schemas__PeriodType } from './chap_core__rest_api__services__schemas__PeriodType';
import type { ModelMetadata } from './ModelMetadata';
/**
 * ML service information extending base ServiceInfo with model-specific fields.
 */
export type MLServiceInfo_Output = {
    /**
     * Unique service identifier (slug format)
     */
    id: string;
    display_name: string;
    version?: string;
    description?: (string | null);
    model_metadata: ModelMetadata;
    period_type: chap_core__rest_api__services__schemas__PeriodType;
    min_prediction_periods?: number;
    max_prediction_periods?: number;
    allow_free_additional_continuous_covariates?: boolean;
    required_covariates?: Array<string>;
    requires_geo?: boolean;
};

