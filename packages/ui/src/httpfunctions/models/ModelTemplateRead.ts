/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorAssessedStatus } from './AuthorAssessedStatus';
import type { PeriodType } from './PeriodType';
/**
 * ModelTemplateRead is a read model for the ModelTemplateDB.
 * It is used to return the model template in a readable format.
 */
export type ModelTemplateRead = {
    displayName?: string;
    description?: string;
    authorNote?: string;
    authorAssessedStatus?: AuthorAssessedStatus;
    author?: string;
    organization?: (string | null);
    organizationLogoUrl?: (string | null);
    contactEmail?: (string | null);
    citationInfo?: (string | null);
    supportedPeriodType?: PeriodType;
    userOptions?: (Record<string, any> | null);
    requiredCovariates?: Array<string>;
    target?: string;
    allowFreeAdditionalContinuousCovariates?: boolean;
    name: string;
    id: number;
    version?: (string | null);
};

