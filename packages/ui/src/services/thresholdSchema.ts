import { OpenAPI } from '../httpfunctions/core/OpenAPI';
import { request } from '../httpfunctions/core/request';

// Use the same base URL, authentication and request queue as the API client.
export const getChapOpenApiSchema = () => request<unknown>(OpenAPI, {
    method: 'GET',
    url: '/openapi.json',
});
