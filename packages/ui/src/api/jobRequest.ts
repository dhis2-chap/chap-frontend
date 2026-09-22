import { OpenAPI } from '../httpfunctions/core/OpenAPI';
import { request } from '../httpfunctions/core/request';

// Kept outside the generated client until the CHAP Core endpoint is released.
export const getJobRequest = (jobId: string) => request<Record<string, unknown>>(OpenAPI, {
    method: 'GET',
    url: '/v1/jobs/{job_id}/request',
    path: { job_id: jobId },
});
