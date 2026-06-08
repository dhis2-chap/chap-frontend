/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request body for adding a new configured model on top of a template.
 */
export type ModelConfigurationCreate = {
    /**
     * Canonical name for the new configured model; conventionally `<template_name>:<config_stub>`.
     */
    name: string;
    /**
     * Foreign key to the parent `ModelTemplateDB`.
     */
    modelTemplateId: number;
    /**
     * Values for the user-options declared by the parent template.
     */
    userOptionValues?: Record<string, any>;
    /**
     * Extra continuous covariates beyond the template's required set.
     */
    additionalContinuousCovariates?: Array<string>;
};

