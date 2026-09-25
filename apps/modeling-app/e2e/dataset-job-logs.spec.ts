import { expect, test } from '@playwright/test';
import type { ImportSummaryResponse } from '@dhis2-chap/ui';
import { readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';

test('shows live dataset job logs, final failure logs, and preserves the form for retry', async ({ page }) => {
    test.setTimeout(90_000);
    const datasetName = `E2E dataset logs ${Date.now()}`;
    let jobId: string;
    let status = 'STARTED';
    let logs = '';

    // Submit real DHIS2 data to CHAP, then control the first job's status/logs:
    // dataset imports otherwise finish too quickly to reliably inspect a running job.
    await page.route('**/analytics/make-dataset*', async (route) => {
        const response = await route.fetch();
        const summary = await readJson<ImportSummaryResponse>(response, 'Create dataset');
        expect(summary.id).toBeTruthy();
        jobId = summary.id!;
        await page.route(`**/v1/jobs/${jobId}`, route => route.fulfill({ json: status }));
        await page.route(`**/v1/jobs/${jobId}/logs`, route => route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify(logs),
        }));
        await route.fulfill({ response });
    }, { times: 1 });

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

    logs = 'Dataset import failed: invalid data';
    status = 'FAILURE';
    // Final logs must load even though the terminal status stops periodic refreshes.
    await expect(logsModal.locator('pre')).toHaveText(logs);
    await expect(logsModal.getByText('Failed', { exact: true })).toBeVisible();
    await logsModal.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByText('Dataset creation failed', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'View logs', exact: true }).click();
    await expect(logsModal.locator('pre')).toHaveText(logs);
    await expect(page).toHaveURL(/\/#\/datasets\/new$/);
    await logsModal.getByRole('button', { name: 'Close', exact: true }).click();

    await page.getByRole('button', { name: 'Edit and retry', exact: true }).click();
    await expect(page.getByRole('button', { name: 'View logs', exact: true })).not.toBeVisible();
    await expect(nameInput).toHaveValue(datasetName);
    await expect(nameInput).toBeEnabled();
    const retryResponse = page.waitForResponse(response => response.url().includes('/analytics/make-dataset'));
    await page.getByRole('button', { name: 'Create dataset', exact: true }).click();
    const retrySummary = await readJson<ImportSummaryResponse>(await retryResponse, 'Retry dataset');
    expect(retrySummary.id).toBeTruthy();
    expect(retrySummary.id).not.toBe(jobId!);
    await expect(page.getByText('Dataset created', { exact: true })).toBeVisible();
    await expect(logsModal).not.toBeVisible();
});
