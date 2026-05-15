/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModelTemplateRead } from './ModelTemplateRead';
/**
 * Detailed read view for a single configured model.
 *
 * Exposes the stored configuration (user option values, additional
 * covariates) alongside the parent model template, so the frontend can
 * render the user-option schema (e.g. the `n_lags` dynamic list) next
 * to the chosen values without stitching together multiple list calls.
 */
export type ConfiguredModelInfoRead = {
    id: number;
    name: string;
    displayName: string;
    modelTemplateId: number;
    userOptionValues?: (Record<string, any> | null);
    additionalContinuousCovariates?: Array<string>;
    archived?: boolean;
    usesChapkit?: boolean;
    modelTemplate: ModelTemplateRead;
};

