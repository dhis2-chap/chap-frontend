/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MLServiceInfo_Output } from './MLServiceInfo_Output';
/**
 * Detailed information about a registered service.
 */
export type ServiceDetail = {
    /**
     * Unique service identifier (slug)
     */
    id: string;
    /**
     * Base URL of the chapkit service
     */
    url: string;
    /**
     * MLServiceInfo metadata from chapkit
     */
    info: MLServiceInfo_Output;
    /**
     * ISO timestamp when service was registered
     */
    registered_at: string;
    /**
     * ISO timestamp of last update
     */
    last_updated: string;
    /**
     * ISO timestamp of last keepalive ping
     */
    last_ping_at: string;
    /**
     * ISO timestamp when registration expires
     */
    expires_at: string;
};

