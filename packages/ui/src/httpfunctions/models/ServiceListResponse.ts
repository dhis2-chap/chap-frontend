/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServiceDetail } from './ServiceDetail';
/**
 * Response containing a list of registered services.
 */
export type ServiceListResponse = {
    /**
     * Total number of registered services
     */
    count: number;
    /**
     * List of service details
     */
    services: Array<ServiceDetail>;
};

