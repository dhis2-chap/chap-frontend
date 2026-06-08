/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorAssessedStatus } from './AuthorAssessedStatus';
import type { chap_core__model_spec__PeriodType } from './chap_core__model_spec__PeriodType';
import type { FeatureType } from './FeatureType';
/**
 * API read shape for a legacy `ModelSpec`.
 *
 * Carries the joined `covariates` / `target` references plus the
 * archived / chapkit / configuration fields that the current frontend
 * expects when listing available models.
 */
export type ModelSpecRead = {
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
     * Canonical identifier of the model spec.
     */
    name: string;
    /**
     * URL where the model's source lives.
     */
    sourceUrl?: (string | null);
    /**
     * Period granularity the model accepts (`month`, `week`, or `any`).
     */
    supportedPeriodType?: chap_core__model_spec__PeriodType;
    /**
     * Primary key of the underlying `ModelSpec` row.
     */
    id: number;
    /**
     * Covariate feature types this model supports.
     */
    covariates: Array<FeatureType>;
    /**
     * The feature type this model predicts.
     */
    target: FeatureType;
    /**
     * When True, the model is hidden from default pickers.
     */
    archived?: boolean;
    /**
     * When True, the model is served by a chapkit REST endpoint.
     */
    usesChapkit?: boolean;
    /**
     * Configured user-option values, if any.
     */
    userOptionValues?: (Record<string, any> | null);
    /**
     * Extra continuous covariates passed beyond `covariates`.
     */
    additionalContinuousCovariates?: Array<string>;
};

