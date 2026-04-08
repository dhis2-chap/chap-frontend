/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response returned after successful keepalive ping.
 */
export type PingResponse = {
    /**
     * Service identifier that was pinged
     */
    id: string;
    /**
     * Service status, always 'alive' on success
     */
    status: string;
    /**
     * ISO timestamp of this ping
     */
    last_ping_at: string;
    /**
     * New expiration timestamp after TTL reset
     */
    expires_at: string;
};

