/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Persisted configured-model row — a `ModelTemplateDB` together with a specific configuration.
 */
export type ConfiguredModelDB = {
    /**
     * Values for the user-options declared by the parent `ModelTemplateDB.user_options` schema.
     */
    userOptionValues?: (Record<string, any> | null);
    /**
     * Extra continuous covariates to pass to the model beyond the template's required set.
     */
    additionalContinuousCovariates?: Array<string>;
    /**
     * Canonical identifier; conventionally `<template_name>` or `<template_name>:<config_stub>`. Unique per template version and configuration digest.
     */
    name: string;
    /**
     * Primary key.
     */
    id?: (number | null);
    /**
     * Digest of the configuration contents, see `compute_configuration_digest`.
     */
    configurationDigest?: string;
    /**
     * True for the configuration that CHAP serves for this name. Old ones stay available by id.
     */
    isLive?: boolean;
    /**
     * Foreign key to the parent `ModelTemplateDB`.
     */
    modelTemplateId: number;
    /**
     * When True, the configured model is hidden from default pickers.
     */
    archived?: boolean;
    /**
     * Inherited from the template; True for chapkit-hosted models.
     */
    usesChapkit?: boolean;
};

