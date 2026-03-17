/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MLServiceInfo_Input } from './MLServiceInfo_Input';
/**
 * Request body for registering a new chapkit service.
 */
export type RegistrationRequest = {
    /**
     * Base URL of the chapkit service
     */
    url: string;
    /**
     * MLServiceInfo metadata from chapkit
     */
    info: MLServiceInfo_Input;
};

