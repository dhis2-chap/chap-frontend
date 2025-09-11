/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorAssessedStatus } from './AuthorAssessedStatus';
import type { PeriodType } from './PeriodType';
/**
 * Just a mixin here to get the model info flat in the database.
 */
export type ModelTemplateDB = {
    supportedPeriodType?: PeriodType;
    userOptions?: (Record<string, any> | null);
    requiredCovariates?: Array<string>;
    target?: string;
    allowFreeAdditionalContinuousCovariates?: boolean;
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
    id?: (number | null);
    sourceUrl?: (string | null);
};

