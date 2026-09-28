/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One registered future-weather provider, for populating a picker.
 */
export type WeatherProviderInfo = {
    /**
     * Registry id to pass as `future_weather_provider`.
     */
    id: string;
    /**
     * Human-friendly provider name shown in pickers.
     */
    displayName: string;
    /**
     * Short paragraph explaining where the covariates come from.
     */
    description?: string;
    /**
     * True if the provider reads the forecast window's own observations. Such providers give look-ahead results that are not comparable to production performance, and cannot be used to predict ahead.
     */
    leaksFutureData: boolean;
};

