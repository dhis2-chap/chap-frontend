/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModelTemplateDB } from './ModelTemplateDB';
/**
 * API read shape for a `ConfiguredModelDB` plus its parent template.
 */
export type ConfiguredModelRead = {
    /**
     * Values for the user-options declared by the parent `ModelTemplateDB.user_options` schema.
     */
    userOptionValues?: (Record<string, any> | null);
    /**
     * Extra continuous covariates to pass to the model beyond the template's required set.
     */
    additionalContinuousCovariates?: Array<string>;
    /**
     * Canonical name of the configured model.
     */
    name: string;
    /**
     * Primary key of the configured model.
     */
    id: number;
    /**
     * Parent template the configuration extends.
     */
    modelTemplate: ModelTemplateDB;
};

