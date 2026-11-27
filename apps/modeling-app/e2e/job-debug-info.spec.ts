import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { DataBaseResponse, DatasetMakeRequest, ImportSummaryResponse, JobDiagnostics, MakeBacktestsResponse } from '@dhis2-chap/ui';
import { chapUrl, getChap, getJobStatus, readJson } from './helpers/evaluation-fixtures';
import { isVersionCompatible } from '../src/utils/compareVersions';

for (const { status, label, minimumVersion } of [
    { status: 'FAILURE', label: 'Failed', minimumVersion: '2.6.0' },
    { status: 'SUCCESS', label: 'Success', minimumVersion: '2.8.0' },
]) {
    test(`downloads diagnostics and client context for a ${status} job`, async ({ page }) => {
        test.setTimeout(90_000);
        const { chap_core_version: chapVersion } = await readJson<{ chap_core_version: string }>(
            await getChap(page, '/system/info'),
            'Load Chap Core version',
        );
        test.skip(!isVersionCompatible(chapVersion, minimumVersion), `Job diagnostics need Chap Core >= ${minimumVersion}`);
        const pollStatus = (id: string, expected: string) => expect.poll(
            () => getJobStatus(page, id, 'Poll job'),
            { timeout: 45_000, intervals: [1_000] },
        ).toBe(expected);
        let name = `E2E debug info ${status} ${Date.now()}`;
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
            providedData: Array.from({ length: 12 }, (_, index) => ({
                orgUnit, period: `2020${String(index + 1).padStart(2, '0')}`, featureName: 'disease_cases', value: 10 + index,
            })),
            dataToBeFetched: [],
        };
        let { id: jobId } = await readJson<ImportSummaryResponse>(
            await page.request.post(chapUrl('/v1/analytics/make-dataset'), { data: request }),
            'Create dataset job',
        );
        expect(jobId).toBeTruthy();
        if (status === 'FAILURE') {
            // The naive model reads rainfall and temperature, which this dataset lacks, so its evaluation fails in the worker.
            await pollStatus(jobId!, 'SUCCESS');
            const { id: datasetId } = await readJson<DataBaseResponse>(
                await getChap(page, `/v1/jobs/${jobId}/database_result`),
                'Load dataset id',
            );
            const evaluation = await readJson<MakeBacktestsResponse>(
                await page.request.post(chapUrl('/v1/analytics/create-backtests'), {
                    data: { name, datasetId, modelIds: ['naive_model'], nPeriods: 3, nSplits: 2, stride: 1 },
                }),
                'Start an evaluation that fails',
            );
            jobId = evaluation.jobs[0].jobId;
            // Chap Core names each job of an evaluation after the request and the model.
            name = `${name}/naive_model`;
        }
        await pollStatus(jobId!, status);

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
        const appPackage = JSON.parse(await readFile(path.resolve(__dirname, '../package.json'), 'utf8'));
        expect(client.appVersion).toBe(appPackage.version);
        expect(client.dhis2Version).toMatch(/^2\.\d+/);
        expect(client.browser).toBe(await page.evaluate(() => navigator.userAgent));
        await expect(page.getByText('Debug info downloaded. Logs may contain data values. Check the file before sharing.')).toBeVisible();
    });
}
