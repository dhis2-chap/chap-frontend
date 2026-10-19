import { expect, test } from '@playwright/test';
import type { AlertRead, DataBaseResponse, JobResponse, PredictionInfo } from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, getChap, pollEvaluationJob, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';

test.setTimeout(240_000);

test.describe.serial('alert level presentation', () => {
    let policyId: number;
    const policyName = `E2E alert colours ${Date.now()}`;

    test('saves editable levels and retries a failed colour save without creating another policy', async ({ page }) => {
        await page.goto('/#/alerts');
        await page.getByRole('button', { name: 'New policy', exact: true }).click();
        const modal = page.locator('[data-test="create-alert-policy-modal"]');
        await modal.getByLabel('Policy name', { exact: true }).fill(policyName);
        const names = modal.getByLabel('Level name', { exact: true });
        await expect(names.nth(0)).toHaveValue('Watch');
        await expect(names.nth(1)).toHaveValue('Possible outbreak');
        await names.nth(1).fill('Action');
        // A zero percentile ensures this fixture raises alerts, regardless of its forecast values.
        await modal.getByLabel('Percentile (%)', { exact: true }).nth(0).fill('0');
        let creations = 0;
        page.on('request', (request) => {
            if (request.method() === 'POST' && request.url().endsWith('/v1/crud/alert-policies')) creations++;
        });
        await page.route('**/dataStore/modeling/alert-policy-display-*', async (route) => {
            if (route.request().method() === 'PUT') {
                await route.fulfill({ status: 503, json: { httpStatusCode: 503, message: 'Temporary failure' } });
            } else await route.continue();
        });
        const created = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/v1/crud/alert-policies'));
        await modal.getByRole('button', { name: 'Create policy', exact: true }).click();
        policyId = (await readJson<DataBaseResponse>(await created, 'Create policy')).id;
        await expect(modal.getByText('Policy created, but colours could not be saved', { exact: true })).toBeVisible();
        await page.unroute('**/dataStore/modeling/alert-policy-display-*');
        await modal.getByRole('button', { name: 'Retry saving colours' }).click();
        await expect(modal).not.toBeVisible();
        expect(creations).toBe(1);
        await page.reload();
        const row = page.getByRole('row').filter({ hasText: policyName });
        await row.getByRole('button', { name: 'Labels and colours' }).click();
        const edit = page.locator('[data-test="edit-alert-policy-display-modal"]');
        await edit.getByLabel('Action', { exact: true }).fill('Investigate');
        await edit.locator('[data-test="dhis2-uiwidgets-singleselectfield"]').nth(1).click();
        await page.getByText('Purple', { exact: true }).click();
        await edit.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(edit).not.toBeVisible();
        await page.reload();
        await expect(row.getByText(/Investigate/)).toHaveCSS('color', 'rgb(113, 58, 145)');
    });

    test('shows recorded alerts with the saved labels and colours on prediction details', async ({ page }) => {
        const evaluation = await createCompletedNaiveEvaluation(page);
        const setup = await readJson<DataBaseResponse>(await page.request.post(chapUrl('/v1/crud/prediction-setups'), {
            data: { backtestId: evaluation.id, name: `E2E alert run ${Date.now()}`, alertPolicyId: policyId },
        }), 'Create prediction setup');
        await page.goto(`/#/predictions/${setup.id}/new`);
        await page.locator('[data-test="prediction-name-input"] input').fill(`E2E raised alerts ${Date.now()}`);
        await selectPeriod(page, 'prediction-absolute-period-input', evaluation.dataset!.lastPeriod!);
        const running = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith(`/prediction-setups/${setup.id}/run`));
        await page.locator('[data-test="prediction-start-button"]').click();
        const job = await readJson<JobResponse>(await running, 'Run prediction');
        await pollEvaluationJob(page, job.id);
        const prediction = await readJson<PredictionInfo>(await getChap(page, `/v1/jobs/${job.id}/database_result`), 'Load prediction');
        const alerts = await readJson<AlertRead[]>(await getChap(page, `/v1/crud/alerts?predictionId=${prediction.id}`), 'Load recorded alerts');
        expect(alerts.length).toBeGreaterThan(0);
        await page.goto(`/#/predictions/${setup.id}/runs/${prediction.id}`);
        const table = page.locator('[data-test="prediction-raised-alerts"]');
        await expect(table.locator('tbody tr')).toHaveCount(alerts.length);
        const label = alerts.some(alert => alert.level === 'Action') ? 'Investigate' : 'Watch';
        const color = label === 'Investigate' ? 'rgb(113, 58, 145)' : 'rgb(152, 73, 0)';
        await expect(table.getByText(label, { exact: true }).first()).toHaveCSS('color', color);
        const region = await table.locator('tbody tr').filter({ hasText: label }).first().locator('td').first().innerText();
        await page.getByPlaceholder('Search regions').fill(region);
        await expect(page.locator('article .highcharts-plot-band').first()).toBeVisible();
        await expect(page.locator('article').getByText(label, { exact: true }).first()).toBeVisible();
    });
});
