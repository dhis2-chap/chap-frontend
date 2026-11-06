import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { DatasetMakeRequest, ImportSummaryResponse, JobDiagnostics } from '@dhis2-chap/ui';
import { chapUrl, getChap, getJobStatus, readJson } from './helpers/evaluation-fixtures';
import { isVersionCompatible } from '../src/utils/compareVersions';

for (const { status, label } of [
    { status: 'FAILURE', label: 'Failed' },
    { status: 'SUCCESS', label: 'Success' },
    { status: 'REVOKED', label: 'Cancelled' },
]) {
    test(`downloads diagnostics and client context for a ${status} job`, async ({ page }) => {
        test.setTimeout(90_000);
        const systemInfo = await readJson<{ chap_core_version: string }>(
            await getChap(page, '/system/info'),
            'Load Chap Core version',
        );
        const minimumVersion = status === 'FAILURE' ? '2.6.0' : '2.7.0';
        test.skip(!isVersionCompatible(systemInfo.chap_core_version, minimumVersion), `Job diagnostics need Chap Core >= ${minimumVersion}`);
        const name = `E2E debug info ${status} ${Date.now()}`;
        // Give the cancelled import enough work to still be running when we cancel it.
        const orgUnits = Array.from({ length: status === 'REVOKED' ? 100 : 1 }, (_, index) => `region-${index}`);
        const request: DatasetMakeRequest = {
            name,
            geojson: {
                type: 'FeatureCollection',
                features: orgUnits.map(orgUnit => ({
                    type: 'Feature',
                    id: orgUnit,
                    properties: { name: 'Test region' },
                    geometry: { type: 'Polygon', coordinates: [[[102, 18], [103, 18], [103, 19], [102, 19], [102, 18]]] },
                })),
            },
            providedData: orgUnits.flatMap(orgUnit => Array.from({ length: 60 }, (_, index) => ({
                orgUnit,
                period: `${2020 + Math.floor(index / 12)}${String(index % 12 + 1).padStart(2, '0')}`,
                featureName: 'disease_cases',
                value: 10 + index,
            }))),
            // Fetching climate data during import is unsupported and fails in the worker.
            dataToBeFetched: status === 'FAILURE' ? [{ featureName: 'rainfall', dataSourceName: 'total_precipitation' }] : [],
        };
        const { id: jobId } = await readJson<ImportSummaryResponse>(
            await page.request.post(chapUrl('/v1/analytics/make-dataset'), { data: request }),
            'Create job',
        );
        expect(jobId).toBeTruthy();
        if (status === 'REVOKED') {
            await expect.poll(
                () => getJobStatus(page, jobId!, 'Wait for import to start'),
                { timeout: 45_000, intervals: [100] },
            ).toBe('STARTED');
            await readJson(await page.request.post(chapUrl(`/v1/jobs/${jobId}/cancel`)), 'Cancel job');
        }
        await expect.poll(
            () => getJobStatus(page, jobId!, 'Poll job'),
            { timeout: 45_000, intervals: [1_000] },
        ).toBe(status);

        await page.goto(`/#/jobs?search=${encodeURIComponent(name)}`);
        const row = page.getByRole('row').filter({ hasText: name });
        await expect(row).toContainText(label);
        await row.getByRole('button', { name: 'More', exact: true }).click();
        const responsePromise = page.waitForResponse(response => response.url().endsWith(`/v1/jobs/${jobId}/diagnostics`));
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('menuitem', { name: 'Download debug info', exact: true }).click();
        const diagnostics = await readJson<JobDiagnostics>(await responsePromise, 'Download diagnostics');
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe(`job-${jobId}-debug-info.json`);
        const { backend, client } = JSON.parse(await readFile((await download.path())!, 'utf8'));
        expect(backend).toEqual(diagnostics);
        expect(backend.job).toMatchObject({ id: jobId, name, status });
        if (status === 'FAILURE') {
            expect(backend.traceback).toEqual(expect.any(String));
        }
        const appPackage = JSON.parse(await readFile(path.resolve(__dirname, '../package.json'), 'utf8'));
        expect(client.appVersion).toBe(appPackage.version);
        expect(client.dhis2Version).toMatch(/^2\.\d+/);
        expect(client.browser).toBe(await page.evaluate(() => navigator.userAgent));
        await expect(page.getByText('Debug info downloaded. Logs may contain data values. Check the file before sharing.')).toBeVisible();

        // Older backends support diagnostics only for failed jobs.
        await page.route('**/api/routes/*/run/system/info', route => route.fulfill({ json: { ...systemInfo, chap_core_version: '2.6.0' } }));
        await page.reload();
        await row.getByRole('button', { name: 'More', exact: true }).click();
        await expect(page.getByRole('menuitem', { name: 'Download debug info', exact: true })).toHaveCount(status === 'FAILURE' ? 1 : 0);
    });
}
