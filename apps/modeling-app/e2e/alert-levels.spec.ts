import { expect, test, type Page } from '@playwright/test';
import type { AlertRead, AlertsCreate, DataBaseResponse, JobResponse, PredictionEntry, PredictionInfo, RunPredictionSetupRequest } from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, getChap, pollEvaluationJob, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';

test.setTimeout(240_000);

test.describe.serial('signal level presentation', () => {
    let policyId: number;
    let predictionRequest: RunPredictionSetupRequest;
    let reviewRunUrl: string;
    let reviewAlerts: AlertRead[];
    const policyName = `E2E alert colours ${Date.now()}`;
    const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b);
    const alertIdsOf = (orgUnit: string) => sorted(reviewAlerts.filter(alert => alert.orgUnit === orgUnit).map(alert => alert.id));
    const waitForReview = (page: Page) => page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/v1/crud/alerts/$approve'));

    test.beforeEach(async ({ page }) => {
        const response = await getChap(page, '/v1/crud/alert-policies');
        expect([200, 404]).toContain(response.status());
        test.skip(!response.ok(), 'Stable Chap releases predate alert policies');
    });

    test('saves editable levels and retries a failed colour save without creating another policy', async ({ page }) => {
        await page.goto('/#/alerts');
        await expect(page).toHaveURL(/#\/signals$/);
        await expect(page.getByRole('heading', { name: 'Signal policies', exact: true })).toBeVisible();
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
        await expect(page.getByText('Signal policy created', { exact: true })).toBeVisible();
        expect(creations).toBe(1);
        await page.reload();
        const row = page.getByRole('row').filter({ hasText: policyName });
        await row.getByRole('button', { name: 'Edit', exact: true }).click();
        const edit = page.locator('[data-test="edit-alert-policy-modal"]');
        await expect(edit.getByLabel('Level name', { exact: true }).nth(1)).toBeDisabled();
        await expect(edit.getByLabel('Custom colour', { exact: true }).nth(0)).toHaveValue('#11aabb');
        await expect(edit.getByLabel('No signal import code', { exact: true })).toHaveValue('0');
        await expect(edit.getByLabel('Import code', { exact: true }).nth(1)).toHaveValue('RED');
        await edit.getByLabel('Import code', { exact: true }).nth(1).fill('ACTION');
        await edit.getByRole('button', { name: 'Yellow', exact: true }).nth(1).click();
        await expect(edit.getByRole('button', { name: 'Yellow', exact: true }).nth(1)).toHaveAttribute('aria-pressed', 'true');
        const codesSaved = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().endsWith(`/v1/crud/alert-policies/${policyId}`));
        await edit.getByRole('button', { name: 'Save', exact: true }).click();
        expect((await codesSaved).request().postDataJSON()).toEqual({ noAlertOutputCode: '0', levelOutputCodes: { Watch: '1', Action: 'ACTION' } });
        await expect(edit).not.toBeVisible();
        await expect(page.getByText('Signal policy saved', { exact: true })).toBeVisible();
        await page.reload();
        await expect(row.getByText(/Action/).locator('span')).toHaveCSS('background-color', 'rgb(255, 193, 7)');
        await expect(row.getByText(/Watch/).locator('span')).toHaveCSS('background-color', 'rgb(17, 170, 187)');
        await row.getByRole('button', { name: 'Edit', exact: true }).click();
        await expect(edit.getByLabel('Import code', { exact: true }).nth(1)).toHaveValue('ACTION');
        await edit.getByRole('button', { name: 'Cancel', exact: true }).click();
        // Policies without saved colours fall back to defaults instead of erroring.
        await expect(page.getByText(/Saved colours could not be loaded/)).toHaveCount(0);
    });

    test('shows policy thresholds by default and restores them after exploration', async ({ page }) => {
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
        reviewRunUrl = `/#/predictions/${setup.id}/runs/${prediction.id}`;
        reviewAlerts = alerts;
        await page.goto(`/#/predictions/${setup.id}/runs/${prediction.id}`);
        const label = alerts.some(alert => alert.level === 'Action') ? 'Action' : 'Watch';
        const color = label === 'Action' ? 'rgb(255, 193, 7)' : 'rgb(17, 170, 187)';
        const alert = alerts.find(item => item.level === label)!;
        const orgUnit = await readJson<{ displayName: string }>(await page.request.get(
            `${process.env.E2E_DHIS2_BASE_URL ?? 'http://localhost:8080'}/api/organisationUnits/${alert.orgUnit}?fields=displayName`,
        ), 'Load alert region');
        await page.getByPlaceholder('Search organisation units').fill(orgUnit.displayName);
        const plot = page.locator('article');
        const alertLevels = page.getByRole('switch', { name: 'Signal levels', exact: true });
        const exploreThresholds = page.getByRole('switch', { name: 'Explore thresholds', exact: true });
        await expect(alertLevels).toBeChecked();
        await expect(exploreThresholds).not.toBeChecked();
        await expect(plot.getByText(label, { exact: true }).locator('span')).toHaveCSS('background-color', color);
        await expect(plot.locator('.highcharts-plot-band').first()).toBeVisible();
        // Both saved levels use different parameters, so the policy view draws two
        // lines; exploration draws a single one in the same colour.
        const thresholdLines = plot.locator('.highcharts-graph[stroke="#212934"]');
        await expect(thresholdLines).toHaveCount(2);
        await alertLevels.uncheck();
        await expect(plot.getByText(label, { exact: true })).toHaveCount(0);
        await expect(plot.locator('.highcharts-plot-band')).toHaveCount(0);
        await expect(thresholdLines).toHaveCount(0);
        await alertLevels.check();
        await expect(plot.getByText(label, { exact: true })).toBeVisible();
        await expect(plot.locator('.highcharts-plot-band').first()).toBeVisible();
        await expect(thresholdLines).toHaveCount(2);

        await exploreThresholds.check();
        await expect(alertLevels).toBeDisabled();
        await expect(plot.getByText(label, { exact: true })).toHaveCount(0);
        await expect(page.locator('[data-test="alert-level-filter"]')).toHaveCount(0);
        await expect(thresholdLines).toHaveCount(1);
        await expect(page.getByText('Organisation units exceeding threshold', { exact: true })).toBeVisible();
        await exploreThresholds.uncheck();
        await expect(alertLevels).toBeEnabled();
        await expect(thresholdLines).toHaveCount(2);
        await expect(plot.getByText(label, { exact: true })).toBeVisible();
        await expect(plot.locator('.highcharts-plot-band').first()).toBeVisible();
        await expect(page.getByText('Organisation units exceeding threshold', { exact: true })).toHaveCount(0);
    });

    test('approves an organisation unit\'s signals, retries a failed save and keeps the decision after reload', async ({ page }) => {
        await page.goto(reviewRunUrl);
        await expect(page.locator('[data-test="signal-review-status"]')).toHaveText(
            `${reviewAlerts.length} of ${reviewAlerts.length} signals awaiting review (0 approved, 0 declined).`,
        );
        await page.getByRole('button', { name: 'Review signals', exact: true }).click();
        await expect(page).toHaveURL(url => url.hash === `${reviewRunUrl.slice(1)}/signals`);
        const { orgUnit } = reviewAlerts[0];
        const row = page.locator(`[data-test="signal-review-${orgUnit}"]`);
        await expect(row.getByText('Pending', { exact: true })).toBeVisible();

        // Only the failed write is mocked; the retry and persistence use the real backend.
        await page.route('**/v1/crud/alerts/$approve', route => route.fulfill({ status: 503, json: { detail: 'Temporary failure' } }), { times: 1 });
        await row.getByRole('button', { name: 'Approve', exact: true }).click();
        await expect(page.getByText('Unable to save the review. Please try again.', { exact: true })).toBeVisible();
        await expect(row.getByText('Pending', { exact: true })).toBeVisible();

        const saved = waitForReview(page);
        await row.getByRole('button', { name: 'Approve', exact: true }).click();
        const response = await saved;
        const reviewer = await readJson<{ username: string }>(await page.request.get(
            `${process.env.E2E_DHIS2_BASE_URL ?? 'http://localhost:8080'}/api/me?fields=username`,
        ), 'Load reviewer');
        const request = response.request().postDataJSON();
        expect({ ...request, alertIds: sorted(request.alertIds) }).toEqual({ alertIds: alertIdsOf(orgUnit), approved: 'approved', approvedBy: reviewer.username });
        const [approved] = await readJson<AlertRead[]>(response, 'Approve signals');
        expect(approved.approvedAt).toBeTruthy();
        await expect(row.getByText('Approved', { exact: true })).toBeVisible();
        await expect(page.getByText('Unable to save the review. Please try again.', { exact: true })).toHaveCount(0);

        // The review has its own address, so a reload stays on it.
        await page.reload();
        await expect(row.getByText('Approved', { exact: true })).toBeVisible();
        await expect(row.getByText(reviewer.username, { exact: true })).toBeVisible();
        await expect(row.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
    });

    test('shows the evidence behind signals, bulk-approves only pending signals and reopens a decision', async ({ page }) => {
        await page.goto(`${reviewRunUrl}/signals`);
        // The first organisation unit was approved by the previous test.
        const [approved, declined] = [...new Set(reviewAlerts.map(alert => alert.orgUnit))];
        const pendingIds = sorted(reviewAlerts.filter(alert => alert.orgUnit !== approved && alert.orgUnit !== declined).map(alert => alert.id));
        expect(pendingIds.length).toBeGreaterThan(0);
        const row = page.locator(`[data-test="signal-review-${declined}"]`);

        await row.locator('td').first().click();
        const evidence = page.locator(`[data-test="signal-review-${declined}-expandedrow"]`);
        await expect(evidence.locator('.highcharts-plot-band').first()).toBeVisible();
        await expect(evidence.locator('.highcharts-graph[stroke="#212934"]')).toHaveCount(2);
        // The evaluation's scores for the policy that raised the signals cover every organisation unit, so they sit above the table.
        const scores = page.locator('[data-test="outbreak-metrics"]');
        await expect(scores.locator('[data-test="outbreak-policy"]')).toContainText(policyName);
        await expect(scores.getByRole('heading', { name: 'All forecast horizons' })).toBeVisible();

        let saved = waitForReview(page);
        await row.getByRole('button', { name: 'Decline', exact: true }).click();
        let request = (await saved).request().postDataJSON();
        expect(request.approved).toBe('declined');
        expect(sorted(request.alertIds)).toEqual(alertIdsOf(declined));
        await expect(row.getByText('Declined', { exact: true })).toBeVisible();

        // Selecting everything must leave the approved and the declined organisation unit alone.
        await page.locator('[data-test="signal-review-select-all"]').click();
        await expect(page.getByText(`${pendingIds.length} of ${pendingIds.length} pending signals selected`, { exact: true })).toBeVisible();
        saved = waitForReview(page);
        await page.getByRole('button', { name: 'Approve selected', exact: true }).click();
        request = (await saved).request().postDataJSON();
        expect(request.approved).toBe('approved');
        expect(sorted(request.alertIds)).toEqual(pendingIds);
        await expect(page.getByText('0 of 0 pending signals selected', { exact: true })).toBeVisible();
        await expect(row.getByText('Declined', { exact: true })).toBeVisible();

        saved = waitForReview(page);
        await row.getByRole('button', { name: 'Reset to pending', exact: true }).click();
        request = (await saved).request().postDataJSON();
        expect(request.approved).toBe('pending');
        expect(sorted(request.alertIds)).toEqual(alertIdsOf(declined));
        await expect(row.getByText('Pending', { exact: true })).toBeVisible();
        await expect(page.getByText(`0 of ${alertIdsOf(declined).length} pending signals selected`, { exact: true })).toBeVisible();

        // The run page counts the decisions made here.
        await page.goto(reviewRunUrl);
        await expect(page.locator('[data-test="signal-review-status"]')).toHaveText(
            `${alertIdsOf(declined).length} of ${reviewAlerts.length} signals awaiting review (${reviewAlerts.length - alertIdsOf(declined).length} approved, 0 declined).`,
        );
    });

    test('filters organisation units by one or more signal levels, combines with search and selects them for review by level', async ({ page }) => {
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
        await expect(filter).toContainText('Filter by signal level');
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
        const alertLevels = page.getByRole('switch', { name: 'Signal levels', exact: true });
        await alertLevels.uncheck();
        await expect(filter).toHaveCount(0);
        await expect(plots.getByRole('heading', { name: orgUnit.displayName, exact: true })).toBeVisible();
        // The selection survives hiding the alerts.
        await alertLevels.check();
        await expect(filter).toContainText('Watch');
        await expect(plots).toHaveCount(0);

        // In the review, an organisation unit is selected by its most severe signal, so Watch leaves the mixed one out.
        await page.goto(`/#/predictions/${setup.id}/runs/${prediction.id}/signals`);
        await page.locator('[data-test="signal-review-select-level-Watch"]').click();
        await expect(page.getByText('1 of 4 pending signals selected', { exact: true })).toBeVisible();
        await expect(page.locator(`[data-test="signal-review-${watchRegion}"] input[type="checkbox"]`)).toBeChecked();
        await page.locator('[data-test="signal-review-select-level-Action"]').click();
        await expect(page.getByText('4 of 4 pending signals selected', { exact: true })).toBeVisible();
    });
});
