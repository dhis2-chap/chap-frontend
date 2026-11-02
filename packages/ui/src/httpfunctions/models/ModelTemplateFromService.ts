/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request body for storing a model template from a registered chapkit service.
 */
export type ModelTemplateFromService = {
    /**
     * Id the service registered under in the v2 service registry.
     */
    serviceId: string;
    /**
     * Role from the model's marketplace entry. 'comparison' flags the template as a comparison model; null makes it an ordinary model. Baselines are built into chap-core and cannot be set here.
     */
    role?: (string | null);
};

