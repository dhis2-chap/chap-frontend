import { OpenAPI } from '../httpfunctions/core/OpenAPI';
import { request } from '../httpfunctions/core/request';

export type CovariateNameSuggestion = {
    name: string;
    standard: boolean;
    requiredBy: string[];
};

// Kept outside the generated client until its next OpenAPI regeneration.
export const getCovariateNames = () => request<CovariateNameSuggestion[]>(OpenAPI, {
    method: 'GET',
    url: '/v1/analytics/covariate-names',
});
