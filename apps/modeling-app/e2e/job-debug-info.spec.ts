import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { DatasetMakeRequest, ImportSummaryResponse, JobDiagnostics } from '@dhis2-chap/ui';
import { chapUrl, getChap, getJobStatus, readJson } from './helpers/evaluation-fixtures';
import { isVersionCompatible } from '../src/utils/compareVersions';

test('downloads diagnostics and client context for a failed job', async ({ page }) => {
    test.setTimeout(90_000);
    const { chap_core_version: chapVersion } = await readJson<{ chap_core_version: string }>(
        await getChap(page, '/system/info'),
        'Load Chap Core version',
    );
    test.skip(!isVersionCompatible(chapVersion, '2.6.0'), 'Job diagnostics need Chap Core >= 2.6.0');
    const name = `E2E debug info ${Date.now()}`;
    const orgUnit = 'W6sNfkJcXGC';
    const request: DatasetMakeRequest = {
        name,
        geojson: {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                id: orgUnit,
                properties: { name: 'Test region' },
                geometry: { type: 'Polygon', coordinates: [[[102, 18], [103, 18], [103, 19], [102, 19], [102, 18]]] },
            }],
        },
        providedData: ['202001', '202002', '202003'].map((period, index) => ({
            orgUnit, period, featureName: 'disease_cases', value: 10 + index,
        })),
        // Fetching climate data during import is unsupported and fails in the worker.
        dataToBeFetched: [{ featureName: 'rainfall', dataSourceName: 'total_precipitation' }],
    };
    const { id: jobId } = await readJson<ImportSummaryResponse>(
        await page.request.post(chapUrl('/v1/analytics/make-dataset'), { data: request }),
        'Create failing dataset job',
    );
    expect(jobId).toBeTruthy();
    await expect.poll(
        () => getJobStatus(page, jobId!, 'Poll failed job'),
        { timeout: 45_000, intervals: [1_000] },
    ).toBe('FAILURE');

    await page.goto(`/#/jobs?search=${encodeURIComponent(name)}`);
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText('Failed');
    await row.getByRole('button', { name: 'More', exact: true }).click();
    const responsePromise = page.waitForResponse(response => response.url().endsWith(`/v1/jobs/${jobId}/diagnostics`));
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: 'Download debug info', exact: true }).click();
    const diagnostics = await readJson<JobDiagnostics>(await responsePromise, 'Download diagnostics');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`job-${jobId}-debug-info.json`);
    const { backend, client } = JSON.parse(await readFile((await download.path())!, 'utf8'));
    expect(backend).toEqual(diagnostics);
    expect(backend.job).toMatchObject({ id: jobId, name, status: 'FAILURE' });
    expect(backend.traceback).toEqual(expect.any(String));
    const appPackage = JSON.parse(await readFile(path.resolve(__dirname, '../package.json'), 'utf8'));
    expect(client.appVersion).toBe(appPackage.version);
    expect(client.dhis2Version).toMatch(/^2\.\d+/);
    expect(client.browser).toBe(await page.evaluate(() => navigator.userAgent));
    await expect(page.getByText('Debug info downloaded. Logs may contain data values. Check the file before sharing.')).toBeVisible();
});
