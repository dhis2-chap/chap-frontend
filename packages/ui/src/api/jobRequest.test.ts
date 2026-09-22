import { afterEach, expect, it, vi } from 'vitest';
import { getJobRequest } from './jobRequest';
import { ApiError } from '../httpfunctions/core/ApiError';
import { OpenAPI } from '../httpfunctions/core/OpenAPI';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

it('fetches the original request through the configured authenticated route', async () => {
    vi.spyOn(OpenAPI, 'BASE', 'get').mockReturnValue('https://dhis2.example/api/routes/chap/run');
    vi.spyOn(OpenAPI, 'WITH_CREDENTIALS', 'get').mockReturnValue(true);
    const payload = { modelId: 'model', providedData: [] };
    const fetch = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal('fetch', fetch);

    await expect(getJobRequest('failed-job')).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
        'https://dhis2.example/api/routes/chap/run/v1/jobs/failed-job/request',
        expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
});

it.each([404, 401, 500])('preserves HTTP %s for download error handling', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ detail: 'Unavailable' }, { status })));

    await expect(getJobRequest('job')).rejects.toMatchObject({ status });
    await expect(getJobRequest('job')).rejects.toBeInstanceOf(ApiError);
});
