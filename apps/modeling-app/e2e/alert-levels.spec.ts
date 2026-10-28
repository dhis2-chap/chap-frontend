import { expect, test } from '@playwright/test';
import type { AlertRead, AlertsCreate, DataBaseResponse, JobResponse, PredictionEntry, PredictionInfo, RunPredictionSetupRequest } from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, getChap, pollEvaluationJob, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';

test.setTimeout(240_000);

test.describe.serial('alert level presentation', () => {
    let policyId: number;
    let predictionRequest: RunPredictionSetupRequest;
    const policyName = `E2E alert colours ${Date.now()}`;

    test.beforeEach(async ({ page }) => {
        const response = await getChap(page, '/v1/crud/alert-policies');
        expect([200, 404]).toContain(response.status());
        test.skip(!response.ok(), 'Stable Chap releases predate alert policies');
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
        await expect(modal.getByLabel('Import code', { exact: true }).nth(1)).toHaveValue('2');
        await modal.getByLabel('Import code', { exact: true }).nth(1).fill('RED');
        let creations = 0;
        page.on('request', (request) => {
            if (request.method() === 'POST' && request.url().endsWith('/v1/crud/alert-policies')) creations++;
        });
        await page.route('**/dataStore/modeling/alert-policy-display-*', async (route) => {
            if (route.request().method() !== 'GET') {
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
        await expect(page.getByText('Alert policy created', { exact: true })).toBeVisible();
        expect(creations).toBe(1);
        await page.reload();
        const row = page.getByRole('row').filter({ hasText: policyName });
        await row.getByRole('button', { name: 'Edit', exact: true }).click();
        const edit = page.locator('[data-test="edit-alert-policy-modal"]');
        await expect(edit.getByLabel('Level name', { exact: true }).nth(1)).toBeDisabled();
        await expect(edit.getByLabel('Custom colour', { exact: true }).nth(0)).toHaveValue('#11aabb');
        await expect(edit.getByLabel('No alert import code', { exact: true })).toHaveValue('0');
        await expect(edit.getByLabel('Import code', { exact: true }).nth(1)).toHaveValue('RED');
        await edit.getByLabel('Import code', { exact: true }).nth(1).fill('ACTION');
        await edit.getByRole('button', { name: 'Yellow', exact: true }).nth(1).click();
        await expect(edit.getByRole('button', { name: 'Yellow', exact: true }).nth(1)).toHaveAttribute('aria-pressed', 'true');
        const codesSaved = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().endsWith(`/v1/crud/alert-policies/${policyId}`));
        await edit.getByRole('button', { name: 'Save', exact: true }).click();
        expect((await codesSaved).request().postDataJSON()).toEqual({ noAlertOutputCode: '0', levelOutputCodes: { Watch: '1', Action: 'ACTION' } });
        await expect(edit).not.toBeVisible();
        await expect(page.getByText('Alert policy saved', { exact: true })).toBeVisible();
        await page.reload();
        await expect(row.getByText(/Action/).locator('span')).toHaveCSS('background-color', 'rgb(255, 193, 7)');
        await expect(row.getByText(/Watch/).locator('span')).toHaveCSS('background-color', 'rgb(17, 170, 187)');
        await row.getByRole('button', { name: 'Edit', exact: true }).click();
        await expect(edit.getByLabel('Import code', { exact: true }).nth(1)).toHaveValue('ACTION');
        await edit.getByRole('button', { name: 'Cancel', exact: true }).click();
        // Policies without saved colours fall back to defaults instead of erroring.
        await expect(page.getByText(/Saved colours could not be loaded/)).toHaveCount(0);
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
        const response = await running;
        predictionRequest = response.request().postDataJSON();
        const job = await readJson<JobResponse>(response, 'Run prediction');
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
        await page.getByPlaceholder('Search organisation units').fill(orgUnit.displayName);
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

    test('filters organisation units by one or more alert levels and combines with search', async ({ page }) => {
        // Run without an automatic policy so we can record a predictable mix of alerts.
        const evaluation = await createCompletedNaiveEvaluation(page);
        const setup = await readJson<DataBaseResponse>(await page.request.post(chapUrl('/v1/crud/prediction-setups'), {
            data: { backtestId: evaluation.id, name: `E2E alert filter ${Date.now()}` },
        }), 'Create filter prediction setup');
        const job = await readJson<JobResponse>(await page.request.post(chapUrl(`/v1/crud/prediction-setups/${setup.id}/run`), {
            data: { ...predictionRequest, name: `E2E alert filter ${Date.now()}` },
        }), 'Run filter prediction');
        await pollEvaluationJob(page, job.id);
        const prediction = await readJson<PredictionInfo>(await getChap(page, `/v1/jobs/${job.id}/database_result`), 'Load filter prediction');
        const entries = await readJson<PredictionEntry[]>(await getChap(page, `/v1/analytics/prediction-entry/${prediction.id}?quantiles=0.5`), 'Load forecast periods');
        const periods = [...new Set(entries.map(entry => entry.period))].sort();
        expect(periods.length).toBeGreaterThanOrEqual(2);
        const [mixedRegion, actionRegion, watchRegion] = ['W6sNfkJcXGC', 'YvLOmtTQD6b', 'XKGgynPS1WZ'];
        const data: AlertsCreate = {
            alerts: [
                { orgUnit: mixedRegion, timePeriod: periods[0], level: 'Watch', alertPolicyId: policyId, predictionId: prediction.id },
                { orgUnit: mixedRegion, timePeriod: periods[1], level: 'Action', alertPolicyId: policyId, predictionId: prediction.id },
                { orgUnit: actionRegion, timePeriod: periods[0], level: 'Action', alertPolicyId: policyId, predictionId: prediction.id },
                { orgUnit: watchRegion, timePeriod: periods[0], level: 'Watch', alertPolicyId: policyId, predictionId: prediction.id },
            ],
        };
        await readJson(await page.request.post(chapUrl('/v1/crud/alerts'), { data }), 'Record filter test alerts');
        const orgUnit = await readJson<{ displayName: string }>(await page.request.get(
            `${process.env.E2E_DHIS2_BASE_URL ?? 'http://localhost:8080'}/api/organisationUnits/${actionRegion}?fields=displayName`,
        ), 'Load alert region');
        await page.goto(`/#/predictions/${setup.id}/runs/${prediction.id}`);
        const filter = page.locator('[data-test="alert-level-filter"]');
        // Open from the input's corner: its centre can land on a chip's remove icon once levels are selected.
        const openMenu = () => filter.locator('[data-test="dhis2-uicore-select-input"]').click({ position: { x: 8, y: 8 } });
        const plots = page.locator('article');
        const option = (label: string) => page.locator('[data-test="dhis2-uicore-multiselectoption"]').getByText(label, { exact: true });
        await expect(filter).toContainText('Filter by alert level');
        const selectAll = page.locator('[data-test="alert-level-filter-select-all"]');
        await openMenu();
        await option('Action').click();
        await expect(plots).toHaveCount(2);
        await selectAll.click();
        await expect(selectAll.locator('input')).toBeChecked();
        await page.keyboard.press('Escape');
        await expect(filter).toContainText('Watch');
        await expect(plots).toHaveCount(3);
        await page.getByPlaceholder('Search organisation units').fill(orgUnit.displayName);
        await expect(plots).toHaveCount(1);
        await expect(plots.getByRole('heading', { name: orgUnit.displayName, exact: true })).toBeVisible();
        await page.getByPlaceholder('Search organisation units').clear();
        await openMenu();
        // Unticking Action leaves only Watch selected.
        await option('Action').click();
        await page.keyboard.press('Escape');
        await expect(plots).toHaveCount(2);
        // A region still matches its lower level even when its badge shows the highest one.
        await expect(plots.getByText('Action', { exact: true })).toBeVisible();
        await page.getByPlaceholder('Search organisation units').fill(orgUnit.displayName);
        await expect(page.getByText('No organisation units match the selected filters.', { exact: true })).toBeVisible();
        await filter.locator('[data-test="alert-level-filter-clear"]').click();
        await expect(plots.getByRole('heading', { name: orgUnit.displayName, exact: true })).toBeVisible();
        await openMenu();
        await option('Watch').click();
        await page.keyboard.press('Escape');
        await expect(plots).toHaveCount(0);
        const alertLevels = page.getByRole('switch', { name: 'Alert levels', exact: true });
        await alertLevels.uncheck();
        await expect(filter).toHaveCount(0);
        await expect(plots.getByRole('heading', { name: orgUnit.displayName, exact: true })).toBeVisible();
        await alertLevels.check();
        await expect(filter).toContainText('Filter by alert level');
        await expect(plots.getByRole('heading', { name: orgUnit.displayName, exact: true })).toBeVisible();
    });
});
