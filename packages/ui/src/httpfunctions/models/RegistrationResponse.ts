/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response returned after successful service registration.
 */
export type RegistrationResponse = {
    /**
     * Unique service identifier (slug)
     */
    id: string;
    /**
     * Registration status, always 'registered'
     */
    status: string;
    /**
     * The registered service URL
     */
    service_url: string;
    /**
     * Human-readable status message
     */
    message: string;
    /**
     * Time-to-live in seconds before expiration
     */
    ttl_seconds: number;
    /**
     * URL to use for keepalive pings
     */
    ping_url: string;
};

