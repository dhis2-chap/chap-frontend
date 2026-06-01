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
    /**
     * Human-friendly service name shown to operators.
     */
    display_name: string;
    /**
     * Service version string.
     */
    version?: string;
    /**
     * Short paragraph describing what the service does.
     */
    description?: (string | null);
    /**
     * Author / documentation metadata for the model the service hosts.
     */
    model_metadata: ModelMetadata;
    /**
     * Period granularity the model accepts (`weekly` or `monthly`).
     */
    period_type: PeriodType_Input;
    /**
     * Minimum forecast horizon (in periods) the model supports.
     */
    min_prediction_periods?: number;
    /**
     * Maximum forecast horizon (in periods) the model supports.
     */
    max_prediction_periods?: number;
    /**
     * When True, callers can attach extra continuous covariates beyond `required_covariates`.
     */
    allow_free_additional_continuous_covariates?: boolean;
    /**
     * Covariate names the model must be given to run.
     */
    required_covariates?: Array<string>;
    /**
     * When True, the model needs a GeoJSON polygon set for spatial features.
     */
    requires_geo?: boolean;
};

