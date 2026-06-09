/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessedStatus } from './AssessedStatus';
/**
 * Metadata about the ML model author and documentation.
 */
export type ModelMetadata = {
    /**
     * Person or team that authored the model.
     */
    author?: (string | null);
    /**
     * Free-form note from the author (caveats, intended use, ...).
     */
    author_note?: (string | null);
    /**
     * Author-declared maturity rating (gray/red/orange/yellow/green).
     */
    author_assessed_status?: (AssessedStatus | null);
    /**
     * Contact email for the model author / maintainer.
     */
    contact_email?: (string | null);
    /**
     * Affiliated organisation, if any.
     */
    organization?: (string | null);
    /**
     * URL of an organisation logo to render next to the model.
     */
    organization_logo_url?: (string | null);
    /**
     * How to cite the model in publications (DOI, BibTeX, ...).
     */
    citation_info?: (string | null);
    /**
     * URL to the model's source code repository.
     */
    repository_url?: (string | null);
    /**
     * URL to the model's external documentation.
     */
    documentation_url?: (string | null);
};

