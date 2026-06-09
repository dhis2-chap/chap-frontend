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
 * render the user-option schema (e.g. the ``n_lags`` dynamic list) next
 * to the chosen values without stitching together multiple list calls.
 */
export type ConfiguredModelInfoRead = {
    /**
     * Primary key of the configured model.
     */
    id: number;
    /**
     * Canonical name of the configured model.
     */
    name: string;
    /**
     * Human-friendly name stitched from the template name and (optionally) a configuration stub.
     */
    displayName: string;
    /**
     * Foreign key to the parent `ModelTemplateDB`.
     */
    modelTemplateId: number;
    /**
     * Configured values for the template's user-options.
     */
    userOptionValues?: (Record<string, any> | null);
    /**
     * Extra continuous covariates passed beyond the template's required set.
     */
    additionalContinuousCovariates?: Array<string>;
    /**
     * When True, the configured model is hidden from default pickers.
     */
    archived?: boolean;
    /**
     * Inherited from the template; True for chapkit-hosted models.
     */
    usesChapkit?: boolean;
    /**
     * Parent template the configuration extends.
     */
    modelTemplate: ModelTemplateRead;
};

