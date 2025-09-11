/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorAssessedStatus } from './AuthorAssessedStatus';
import type { FeatureType } from './FeatureType';
import type { PeriodType } from './PeriodType';
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
    name: string;
    sourceUrl?: (string | null);
    supportedPeriodType?: PeriodType;
    id: number;
    covariates: Array<FeatureType>;
    target: FeatureType;
    configurationName?: (string | null);
};

