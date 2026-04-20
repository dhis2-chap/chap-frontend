/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorAssessedStatus } from './AuthorAssessedStatus';
import type { chap_core__model_spec__PeriodType } from './chap_core__model_spec__PeriodType';
import type { FeatureType } from './FeatureType';
export type ModelSpecRead = {
    displayName?: string;
    description?: string;
    authorNote?: string;
    authorAssessedStatus?: AuthorAssessedStatus;
    author?: string;
    organization?: (string | null);
    organizationLogoUrl?: (string | null);
    contactEmail?: (string | null);
    citationInfo?: (string | null);
    documentationUrl?: (string | null);
    name: string;
    sourceUrl?: (string | null);
    supportedPeriodType?: chap_core__model_spec__PeriodType;
    id: number;
    covariates: Array<FeatureType>;
    target: FeatureType;
    archived?: boolean;
};

