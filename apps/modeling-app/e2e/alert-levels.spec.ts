import { expect, test } from '@playwright/test';
import type { AlertRead, DataBaseResponse, JobResponse, PredictionInfo } from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, getChap, pollEvaluationJob, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';

test.setTimeout(240_000);

test.describe.serial('alert level presentation', () => {
    let policyId: number;
    const policyName = `E2E alert colours ${Date.now()}`;

    test.beforeEach(async ({ page }) => {
        const response = await getChap(page, '/v1/crud/alert-policies');
        expect([200, 404]).toContain(response.status());
        test.skip(!response.ok(), 'Stable CHAP releases predate alert policies');
    });

    test('saves editable levels and retries a failed colour save without creating another policy', async ({ page }) => {
        await page.goto('/#/alerts');
        await page.getByRole('button', { name: 'New policy', exact: true }).click();
        const modal = page.locator('[data-test="create-alert-policy-modal"]');
        await modal.getByLabel('Policy name', { exact: true }).fill(policyName);
        const names = modal.getByLabel('Level name', { exact: true });
        await expect(names).toHaveCount(1);
        await expect(names.nth(0)).toHaveValue('');
        await names.nth(0).fill('Watch');
        await modal.getByLabel('Custom colour', { exact: true }).nth(0).fill('#11aabb');
        await modal.locator('[data-test="dhis2-uiwidgets-singleselectfield"]').filter({ hasText: 'Strategy' }).nth(0)
            .locator('[data-test="dhis2-uicore-select-input"]').click();
        await page.locator('[data-test="dhis2-uicore-singleselectoption"]').filter({ hasText: /percentile/i }).click();
        // A zero percentile ensures this fixture raises alerts, regardless of its forecast values.
        await modal.getByLabel('Percentile (%)', { exact: true }).nth(0).fill('0');
        await modal.getByRole('button', { name: 'Add level', exact: true }).click();
        await names.nth(1).fill('Action');
        let creations = 0;
        page.on('request', (request) => {
            if (request.method() === 'POST' && request.url().endsWith('/v1/crud/alert-policies')) creations++;
        });
        await page.route('**/dataStore/modeling/alert-policy-display', async (route) => {
            if (route.request().method() !== 'GET') {
                await route.fulfill({ status: 503, json: { httpStatusCode: 503, message: 'Temporary failure' } });
            } else await route.continue();
        });
        const created = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/v1/crud/alert-policies'));
        await modal.getByRole('button', { name: 'Create policy', exact: true }).click();
        policyId = (await readJson<DataBaseResponse>(await created, 'Create policy')).id;
        await expect(modal.getByText('Policy created, but colours could not be saved', { exact: true })).toBeVisible();
        await page.unroute('**/dataStore/modeling/alert-policy-display');
        await modal.getByRole('button', { name: 'Retry saving colours' }).click();
        await expect(modal).not.toBeVisible();
        expect(creations).toBe(1);
        await page.reload();
        const row = page.getByRole('row').filter({ hasText: policyName });
        await row.getByRole('button', { name: 'Colours', exact: true }).click();
        const edit = page.locator('[data-test="edit-alert-policy-display-modal"]');
        await expect(edit.locator('input[type="text"]')).toHaveCount(0);
        await expect(edit.getByLabel('Custom colour', { exact: true }).nth(0)).toHaveValue('#11aabb');
        await edit.getByRole('button', { name: 'Yellow', exact: true }).nth(1).click();
        await expect(edit.getByRole('button', { name: 'Yellow', exact: true }).nth(1)).toHaveAttribute('aria-pressed', 'true');
        await edit.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(edit).not.toBeVisible();
        await page.reload();
        await expect(row.getByText(/Action/).locator('span')).toHaveCSS('background-color', 'rgb(255, 193, 7)');
        await expect(row.getByText(/Watch/).locator('span')).toHaveCSS('background-color', 'rgb(17, 170, 187)');
    });

    test('shows recorded alerts on prediction plots by default and can hide them', async ({ page }) => {
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
        const label = alerts.some(alert => alert.level === 'Action') ? 'Action' : 'Watch';
        const color = label === 'Action' ? 'rgb(255, 193, 7)' : 'rgb(17, 170, 187)';
        const alert = alerts.find(item => item.level === label)!;
        const orgUnit = await readJson<{ displayName: string }>(await page.request.get(
            `${process.env.E2E_DHIS2_BASE_URL ?? 'http://localhost:8080'}/api/organisationUnits/${alert.orgUnit}?fields=displayName`,
        ), 'Load alert region');
        await page.getByPlaceholder('Search regions').fill(orgUnit.displayName);
        const plot = page.locator('article');
        const alertLevels = page.getByRole('switch', { name: 'Alert levels', exact: true });
        const exploreThresholds = page.getByRole('switch', { name: 'Explore thresholds', exact: true });
        await expect(alertLevels).toBeChecked();
        await expect(exploreThresholds).not.toBeChecked();
        await expect(page.getByText('Raised alerts', { exact: true })).toHaveCount(0);
        await expect(plot.getByText(label, { exact: true }).locator('span')).toHaveCSS('background-color', color);
        await expect(plot.locator('.highcharts-plot-band').first()).toBeVisible();
        await alertLevels.uncheck();
        await expect(plot.getByText(label, { exact: true })).toHaveCount(0);
        await expect(plot.locator('.highcharts-plot-band')).toHaveCount(0);
        await alertLevels.check();
        await expect(plot.getByText(label, { exact: true })).toBeVisible();
        await expect(plot.locator('.highcharts-plot-band').first()).toBeVisible();
    });
});
