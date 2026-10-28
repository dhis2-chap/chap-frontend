import { expect, test } from '@playwright/test';
import type { DataBaseResponse, ImportSummaryResponse, JobDescription } from '@dhis2-chap/ui';
import { getChap, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';

for (const format of ['string', 'object'] as const) {
    test(`handles dataset failures, revocation, logs and successful retry with ${format} job responses`, async ({ page }) => {
        test.setTimeout(90_000);
        const datasetName = `E2E dataset logs ${Date.now()}`;
        let jobId: string;
        let status: string | undefined = 'STARTED';
        let jobRequests = 0;
        let resultRequests = 0;
        let logs = '';

        // Create real datasets, controlling only the job response format/status and logs.
        // Imports finish too quickly to reliably inspect running, failed and revoked jobs.
        page.on('request', (request) => {
            if (request.url().endsWith(`/v1/jobs/${jobId}/database_result`)) resultRequests++;
        });
        await page.route('**/analytics/make-dataset*', async (route) => {
            const response = await route.fetch();
            const summary = await readJson<ImportSummaryResponse>(response, 'Create dataset');
            expect(summary.id).toBeTruthy();
            jobId = summary.id!;
            const currentJobId = jobId;
            jobRequests = 0;
            resultRequests = 0;
            await page.route(`**/v1/jobs/${currentJobId}`, async (route) => {
                jobRequests++;
                // The job list has the same metadata shape on old and new backends.
                const [job] = await readJson<JobDescription[]>(
                    await getChap(page, '/v1/jobs', { params: { ids: currentJobId } }),
                    'Load dataset job',
                );
                const response = { ...job, status: status ?? job.status };
                await route.fulfill({ json: format === 'string' ? response.status : response });
            });
            await page.route(`**/v1/jobs/${jobId}/logs`, route => route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify(logs),
            }));
            await route.fulfill({ response });
        });

        await page.goto('/#/datasets/new');
        const nameInput = page.locator('[data-test="evaluation-name-input"] input');
        await nameInput.fill(datasetName);
        await selectPeriod(page, 'evaluation-from-period-input', '202001');
        await selectPeriod(page, 'evaluation-to-period-input', '202412');
        await page.getByRole('button', { name: 'Select organisation units' }).click();
        const locationModal = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: 'Select Organisation Units' }),
        });
        await locationModal.locator('[data-test="org-unit-level-select"]').click();
        await page.getByText('Province', { exact: true }).click();
        await locationModal.getByRole('button', { name: 'Confirm Selection' }).click();
        await page.getByRole('button', { name: 'Add column', exact: true }).click();
        await page.locator('[data-test="dataset-column-name-0"] input').fill('disease_cases');
        await page.getByRole('button', { name: 'Select a data item...' }).click();
        await page.getByPlaceholder('Search for indicators, data elements, or program indicators').fill('NCLE:');
        await page.getByRole('option', { name: /NCLE:?\s*7\.\s*Dengue cases \(any\)/i }).click();

        const createResponse = page.waitForResponse(response => response.url().includes('/analytics/make-dataset'));
        await page.getByRole('button', { name: 'Create dataset', exact: true }).click();
        expect((await createResponse).ok()).toBe(true);
        await expect(page.getByText('Creating dataset', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'View logs', exact: true }).click();
        const logsModal = page.getByRole('dialog').filter({ has: page.getByText(/Job Logs/) });
        await expect(logsModal).toContainText(jobId!);
        await expect(logsModal).toContainText('No logs reported for this job');

        logs = 'Importing dataset locations';
        await expect(logsModal.locator('pre')).toHaveText(logs, { timeout: 15_000 });
        await expect(logsModal.getByText('Running', { exact: true })).toBeVisible();

        for (const terminalStatus of ['FAILURE', 'REVOKED']) {
            logs = `Dataset import ended with ${terminalStatus}`;
            status = terminalStatus;
            // Final logs must load even though the terminal status stops periodic refreshes.
            await expect(logsModal.locator('pre')).toHaveText(logs);
            await expect(logsModal.getByText(terminalStatus === 'FAILURE' ? 'Failed' : 'Cancelled', { exact: true })).toBeVisible();
            await logsModal.getByRole('button', { name: 'Close', exact: true }).click();
            await expect(page.getByText('Dataset creation failed', { exact: true })).toBeVisible();
            await expect(page.getByText('Creating dataset', { exact: true })).not.toBeVisible();
            const finishedRequests = jobRequests;
            // Observe longer than the two-second polling interval to catch continued polling.
            await page.waitForTimeout(2500);
            expect(jobRequests).toBe(finishedRequests);
            expect(resultRequests).toBe(0);
            await page.getByRole('button', { name: 'View logs', exact: true }).click();
            await expect(logsModal.locator('pre')).toHaveText(logs);
            await expect(page).toHaveURL(/\/#\/datasets\/new$/);
            await logsModal.getByRole('button', { name: 'Close', exact: true }).click();

            await page.getByRole('button', { name: 'Edit and retry', exact: true }).click();
            await expect(page.getByRole('button', { name: 'View logs', exact: true })).not.toBeVisible();
            await expect(nameInput).toHaveValue(datasetName);
            await expect(nameInput).toBeEnabled();
            const previousJobId = jobId!;
            status = 'STARTED';
            logs = 'Importing dataset locations';
            const retryResponse = page.waitForResponse(response => response.url().includes('/analytics/make-dataset'));
            await page.getByRole('button', { name: 'Create dataset', exact: true }).click();
            const retrySummary = await readJson<ImportSummaryResponse>(await retryResponse, 'Retry dataset');
            expect(retrySummary.id).toBeTruthy();
            expect(retrySummary.id).not.toBe(previousJobId);
            await expect(logsModal).not.toBeVisible();
            await page.getByRole('button', { name: 'View logs', exact: true }).click();
            await expect(logsModal.getByText('Running', { exact: true })).toBeVisible();
        }

        // Let the last real job complete, preserving logs and retrieving its actual dataset id.
        logs = 'Dataset imported';
        const resultResponse = page.waitForResponse(response => response.url().endsWith(`/v1/jobs/${jobId}/database_result`));
        status = undefined;
        const result = await readJson<DataBaseResponse>(await resultResponse, 'Load created dataset id');
        await expect(logsModal.locator('pre')).toHaveText(logs);
        await expect(logsModal.getByText('Success', { exact: true })).toBeVisible();
        await logsModal.getByRole('button', { name: 'Close', exact: true }).click();
        await expect(page.getByText('Dataset created', { exact: true })).toBeVisible();
        await expect(page.getByText('Creating dataset', { exact: true })).not.toBeVisible();
        const finishedRequests = jobRequests;
        await page.waitForTimeout(2500);
        expect(jobRequests).toBe(finishedRequests);
        expect(resultRequests).toBe(1);

        await page.getByRole('button', { name: 'New evaluation', exact: true }).click();
        await expect(page).toHaveURL(`/#/evaluate/from-dataset?datasetId=${result.id}`);
    });
}
