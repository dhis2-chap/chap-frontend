/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorAssessedStatus } from './AuthorAssessedStatus';
import type { chap_core__model_spec__PeriodType } from './chap_core__model_spec__PeriodType';
/**
 * Persisted model-template row. Flat composition of metadata + capability mixins.
 */
export type ModelTemplateDB = {
    /**
     * Period granularity the template supports (`month`, `week`, or `any`).
     */
    supportedPeriodType?: chap_core__model_spec__PeriodType;
    /**
     * JSON-schema-like dict describing the user-configurable options the template exposes.
     */
    userOptions?: (Record<string, any> | null);
    /**
     * Search space used by HPO when training this template in `hpo` mode.
     */
    hpoSearchSpace?: (Record<string, any> | null);
    /**
     * Covariate names the template must be given to run.
     */
    requiredCovariates?: Array<string>;
    /**
     * Minimum forecast horizon (in periods) the template supports.
     */
    minPredictionLength?: (number | null);
    /**
     * Maximum forecast horizon (in periods) the template supports.
     */
    maxPredictionLength?: (number | null);
    /**
     * Name of the variable the model predicts.
     */
    target?: string;
    /**
     * When True, callers can attach extra continuous covariates beyond `required_covariates`.
     */
    allowFreeAdditionalContinuousCovariates?: boolean;
    /**
     * When True, the template needs a GeoJSON polygon set for spatial features.
     */
    requiresGeo?: boolean;
    /**
     * Human-friendly name shown in model pickers and plot titles.
     */
    displayName?: string;
    /**
     * Short paragraph explaining what the model does.
     */
    description?: string;
    /**
     * Free-form note from the author (e.g. caveats, intended use cases).
     */
    authorNote?: string;
    /**
     * Author-declared maturity of the model (gray/red/orange/yellow/green).
     */
    authorAssessedStatus?: AuthorAssessedStatus;
    /**
     * Person or team that authored the model.
     */
    author?: string;
    /**
     * Affiliated organisation, if any.
     */
    organization?: (string | null);
    /**
     * URL of an organisation logo to render next to the model.
     */
    organizationLogoUrl?: (string | null);
    /**
     * Contact email for the model author / maintainer.
     */
    contactEmail?: (string | null);
    /**
     * How to cite the model in publications (e.g. DOI, BibTeX).
     */
    citationInfo?: (string | null);
    /**
     * URL to the model's external documentation.
     */
    documentationUrl?: (string | null);
    /**
     * Canonical unique identifier of the template.
     */
    name: string;
    /**
     * Primary key.
     */
    id?: (number | null);
    /**
     * URL where the template's source lives (e.g. a GitHub repo).
     */
    sourceUrl?: (string | null);
    /**
     * Template version string, typically a git tag or commit sha.
     */
    version?: (string | null);
    /**
     * When True, the template is hidden from default pickers but still resolvable.
     */
    archived?: boolean;
    /**
     * When True, the template is served by a chapkit REST endpoint rather than an MLproject directory.
     */
    usesChapkit?: boolean;
};

