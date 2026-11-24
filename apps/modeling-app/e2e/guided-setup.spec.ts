import { expect, test } from '@playwright/test';
import type { DataBaseResponse, MakeBacktestsResponse } from '@dhis2-chap/ui';
import { getChap, pollEvaluationJob, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';
import { toDataTestKey } from '../src/utils/dataTestKey';

// The columns the guided import starts with, and the DHIS2 data item for each.
const COLUMNS = [
    { name: 'disease_cases', search: 'NCLE:', option: /NCLE:?\s*7\.\s*Dengue cases \(any\)/i },
    { name: 'rainfall', search: 'CCH - Precipitation (CHIRPS)', option: /CCH\s*-\s*Precipitation \(CHIRPS\)/i },
    { name: 'mean_temperature', search: 'CCH - Air temperature', option: /CCH\s*-\s*Air temperature \(ERA-?5[-\s]Land\)/i },
];

test('goes from DHIS2 data to a prediction setup on one page', async ({ page }) => {
    test.setTimeout(360_000);
    test.skip(!(await getChap(page, '/v1/crud/backtest-specifications')).ok(), 'The guided setup needs Chap Core 2.4.0 or newer.');
    const name = `E2E guided ${Date.now()}`;

    await page.goto('/#/guided');
    // Data from earlier runs is picked up automatically, so ask for new data.
    const changeData = page.locator('[data-test="guided-step-1"]').getByRole('button', { name: 'Change', exact: true });
    const importData = page.locator('[data-test="guided-import-data"]');
    await expect(changeData.or(importData)).toBeVisible();
    if (await changeData.isVisible()) await changeData.click();
    await importData.click();

    await page.locator('[data-test="evaluation-name-input"] input').fill(name);
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

    // The imported data becomes the subject of the remaining steps.
    await expect(page.locator('[data-test="guided-step-1"]')).toContainText(name, { timeout: 60_000 });
    const startEvaluation = page.locator('[data-test="guided-start-evaluation"]');
    await expect(startEvaluation).toBeVisible();

    await page.getByRole('button', { name: 'Select models', exact: true }).click();
    const models = page.getByRole('dialog');
    await models.locator(`[data-test="model-toggle-${toDataTestKey('naive_model')}"]`).click();
    await models.getByRole('button', { name: 'Use selected models (1)', exact: true }).click();
    const evaluationResponse = page.waitForResponse(response => response.url().endsWith('/v1/analytics/create-backtests') && response.request().method() === 'POST');
    await startEvaluation.click();
    const evaluation = await readJson<MakeBacktestsResponse>(await evaluationResponse, 'Start guided evaluation');
    await expect(page.locator('[data-test="guided-step-3"]')).toHaveAttribute('aria-current', 'step');
    await pollEvaluationJob(page, evaluation.jobs[0].jobId);

    // The result arrives without a reload, and choosing it creates the prediction setup.
    const useModel = page.locator('[data-test^="guided-use-model-"]');
    await expect(useModel).toBeVisible({ timeout: 30_000 });
    await useModel.click();
    await expect(page.locator('[data-test="ready-configuration-name-input"] input')).toHaveValue(name);
    const setupResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().includes('/v1/crud/prediction-setups'));
    await page.locator('[data-test="submit-mark-ready-for-forecasting-button"]').click();
    const setup = await readJson<DataBaseResponse>(await setupResponse, 'Create prediction setup');

    const predictionSetup = page.locator(`[data-test="guided-prediction-setup-${setup.id}"]`);
    await expect(predictionSetup).toContainText(name);
    // Progress is read from Chap, not kept in the browser.
    await page.reload();
    await expect(page.locator('[data-test="guided-step-4"]')).toHaveAttribute('aria-current', 'step');
    await predictionSetup.locator('[data-test="guided-run-prediction"]').click();
    await expect(page).toHaveURL(new RegExp(`/predictions/${setup.id}/new\\?returnTo=`));
    await expect(page.locator('[data-test="prediction-start-button"]')).toBeEnabled();
});

test('opens on the guided setup, or on the dashboard where Chap Core is too old for it', async ({ page }) => {
    const isSupported = (await getChap(page, '/v1/crud/backtest-specifications')).ok();

    await page.goto('/#/');
    await expect(page).toHaveURL(isSupported ? /\/guided$/ : /\/dashboard$/);
    await expect(page.getByRole('link', { name: 'Guided setup', exact: true })).toHaveCount(isSupported ? 1 : 0);
});
