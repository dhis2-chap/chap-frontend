import { expect, test } from '@playwright/test';
import type { AlertPolicyCreate, DataBaseResponse, MakeBacktestsResponse, PredictionSetupCreate } from '@dhis2-chap/ui';
import { chapUrl, getChap, pollEvaluationJob, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';

// The columns the guided import starts with, and the DHIS2 data item for each.
const COLUMNS = [
    { name: 'disease_cases', search: 'NCLE:', option: /NCLE:?\s*7\.\s*Dengue cases \(any\)/i },
    { name: 'rainfall', search: 'CCH - Precipitation (CHIRPS)', option: /CCH\s*-\s*Precipitation \(CHIRPS\)/i },
    { name: 'mean_temperature', search: 'CCH - Air temperature', option: /CCH\s*-\s*Air temperature \(ERA-?5[-\s]Land\)/i },
];

test('goes from DHIS2 data to predictions through the four guided steps', async ({ page }) => {
    test.setTimeout(360_000);
    test.skip(!(await getChap(page, '/v1/crud/backtest-specifications')).ok(), 'The guided setup needs Chap Core 2.4.0 or newer.');
    const name = `E2E guided ${Date.now()}`;
    const policy: AlertPolicyCreate = {
        name: `${name} policy`,
        levels: [{ name: 'Watch', outputCode: '1', thresholdParams: { type: 'percentile', quantile: 0.5 }, exceedanceThreshold: 0.5 }],
    };
    await readJson<DataBaseResponse>(await page.request.post(chapUrl('/v1/crud/alert-policies'), { data: policy }), 'Create signal policy');

    // Step 1: import data. With nothing imported yet the form is already open.
    await page.goto('/#/guided/data');
    const importData = page.locator('[data-test="guided-import-data"]');
    const nameInput = page.locator('[data-test="evaluation-name-input"] input');
    await expect(importData.or(nameInput)).toBeVisible();
    if (await importData.isVisible()) await importData.click();
    await nameInput.fill(name);
    await selectPeriod(page, 'evaluation-from-period-input', '202001');
    await selectPeriod(page, 'evaluation-to-period-input', '202412');
    await page.getByRole('button', { name: 'Select organisation units' }).click();
    const locations = page.getByRole('dialog');
    await locations.locator('[data-test="org-unit-level-select"]').click();
    await page.getByText('Province', { exact: true }).click();
    await locations.getByRole('button', { name: 'Confirm Selection' }).click();
    for (const [index, column] of COLUMNS.entries()) {
        await expect(page.locator(`[data-test="dataset-column-name-${index}"] input`)).toHaveValue(column.name);
        await page.getByRole('button', { name: 'Select a data item...' }).first().click();
        await page.getByPlaceholder('Search for indicators, data elements, or program indicators').fill(column.search);
        await page.getByRole('option', { name: column.option }).click();
    }
    // The test instance has no population data, so drop the column it cannot fill.
    await expect(page.locator(`[data-test="dataset-column-name-${COLUMNS.length}"] input`)).toHaveValue('population');
    await page.getByRole('button', { name: 'Remove column' }).last().click();
    await page.getByRole('button', { name: 'Create dataset', exact: true }).click();

    // Step 2: the imported data opens the evaluation step, where models are picked on the page.
    await expect(page).toHaveURL(/\/guided\/evaluate\?datasetId=\d+$/, { timeout: 60_000 });
    await expect(page.locator('[data-test="guided-step-data"]')).toContainText(name);
    await expect(page.locator('[data-test="guided-continue"]')).toBeDisabled();
    await page.locator('[data-test="evaluation-model-select-button"]').click();
    const picker = page.getByRole('dialog');
    await picker.locator('[data-test="model-toggle-naive-model"]').click();
    await picker.getByRole('button', { name: 'Use selected models (1)', exact: true }).click();
    const evaluationResponse = page.waitForResponse(response => response.url().endsWith('/v1/analytics/create-backtests') && response.request().method() === 'POST');
    await page.locator('[data-test="guided-start-evaluation"]').click();
    const evaluation = await readJson<MakeBacktestsResponse>(await evaluationResponse, 'Start guided evaluation');
    await pollEvaluationJob(page, evaluation.jobs[0].jobId);

    // Step 3: the result arrives without a reload, and promoting it is a step of its own.
    await page.locator('[data-test^="guided-promote-"]').click({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/guided\/promote\?datasetId=\d+&evaluationId=\d+$/);
    await expect(page.locator('[data-test^="guided-promote-model-"] input')).toBeChecked();
    // Before promoting, the page says whether the model can be trusted and shows its forecasts.
    await expect(page.locator('[data-test="guided-trust-check"]')).toContainText('of the actual values were inside its range');
    await expect(page.locator('[data-test="guided-forecast-check"]')).toContainText(/inside the predicted range in \d+ of \d+ periods/);
    await expect(page.locator('[data-test="ready-configuration-name-input"] input')).toHaveValue(name);
    await page.locator('[data-test="prediction-setup-alert-policy-select"]').click();
    await page.getByText(policy.name, { exact: true }).click();
    await expect(page.getByText(/^Watch · /)).toBeVisible();
    const setupResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().includes('/v1/crud/prediction-setups'));
    await page.locator('[data-test="guided-promote-submit"]').click();
    const setupRequest = (await setupResponse).request().postDataJSON() as PredictionSetupCreate;
    expect(setupRequest).toMatchObject({ name, alertPolicyId: expect.any(Number) });
    const setup = await readJson<DataBaseResponse>(await setupResponse, 'Create prediction setup');

    // Step 4: predictions run from the promoted model, with its signal policy in view.
    await expect(page).toHaveURL(/\/guided\/predict\?datasetId=\d+$/);
    await expect(page.locator('[data-test="prediction-setup-alert-policy"]')).toHaveText(policy.name);
    await expect(page.getByText('Model performance monitoring', { exact: true })).toBeVisible();
    // Progress is read from Chap, not kept in the browser: the overview lists the setup as predicting.
    await page.goto('/#/guided');
    const overviewRow = page.locator('[data-test^="guided-setup-"]').filter({ hasText: name });
    await expect(overviewRow).toContainText('Predicting');
    await overviewRow.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/guided\/predict\?datasetId=\d+$/);
    await page.locator('[data-test="quick-action-predict"]').click();
    await expect(page).toHaveURL(new RegExp(`/predictions/${setup.id}/new\\?returnTo=%2Fguided%2Fpredict`));
    await expect(page.locator('[data-test="prediction-start-button"]')).toBeEnabled();
});

test('opens on the guided setup, or on the dashboard where Chap Core is too old for it', async ({ page }) => {
    const isSupported = (await getChap(page, '/v1/crud/backtest-specifications')).ok();

    await page.goto('/#/');
    // The guided setup opens on its overview, or on the first step when nothing is imported yet.
    await expect(page).toHaveURL(isSupported ? /\/guided(\/data.*)?$/ : /\/dashboard$/);
    await expect(page.getByRole('link', { name: 'Guided setup', exact: true })).toHaveCount(isSupported ? 1 : 0);
});
