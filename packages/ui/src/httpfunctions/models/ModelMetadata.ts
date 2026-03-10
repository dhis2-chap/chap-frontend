/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessedStatus } from './AssessedStatus';
/**
 * Metadata about the ML model author and documentation.
 */
export type ModelMetadata = {
    author?: (string | null);
    author_note?: (string | null);
    author_assessed_status?: (AssessedStatus | null);
    contact_email?: (string | null);
    organization?: (string | null);
    organization_logo_url?: (string | null);
    citation_info?: (string | null);
    repository_url?: (string | null);
    documentation_url?: (string | null);
};

