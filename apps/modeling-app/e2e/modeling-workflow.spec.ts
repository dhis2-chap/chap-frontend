import { expect, test } from '@playwright/test';
import { createCompletedNaiveEvaluation, getChap } from './helpers/evaluation-fixtures';

test.use({ actionTimeout: 15_000 });

test('keeps the dataset from workflow setup through evaluation and review', async ({ page }) => {
    test.setTimeout(240_000);
    const evaluation = await createCompletedNaiveEvaluation(page, `E2E workflow ${Date.now()}`);
    const hasBenchmarks = (await getChap(page, '/v1/crud/backtest-specifications')).ok();

    await page.goto('/#/dashboard');
    await page.getByRole('link', { name: 'Start or continue your modeling workflow' }).click();
    await expect(page.getByRole('button', { name: 'Evaluate models', exact: true })).toBeDisabled();
    await page.locator('[data-test="workflow-dataset-select"]').click();
    await page.getByText(evaluation.dataset.name, { exact: true }).click();
    const workflowUrl = page.url();
    await page.reload();
    await expect(page.locator('[data-test="workflow-dataset-select"]')).toContainText(evaluation.dataset.name);
    await page.getByRole('link', { name: 'Inspect selected dataset' }).click();
    await expect(page).toHaveURL(new RegExp(`/datasets/${evaluation.datasetId}$`));
    await page.goBack();

    await page.getByRole('button', { name: 'Evaluate models', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${hasBenchmarks ? '/evaluate/benchmarks/new' : '/evaluate/from-dataset'}\\?datasetId=${evaluation.datasetId}`));
    await expect(page.locator('[data-test="evaluation-dataset-select"]')).toContainText(evaluation.dataset.name);
    await expect(page.getByRole('button', { name: 'Select models', exact: true })).toBeEnabled();

    // Nothing was edited or submitted; the same dataset can now be handed to a reviewer.
    await page.goto(workflowUrl);
    await page.getByRole('button', { name: 'Review results', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${hasBenchmarks ? '/evaluate/benchmarks' : '/evaluate'}\\?datasetId=${evaluation.datasetId}`));
    if (hasBenchmarks) {
        await page.getByRole('link', { name: evaluation.dataset.name, exact: true }).click();
        await page.locator(`[data-test="view-evaluation-${evaluation.id}"]`).click();
    } else {
        await page.getByRole('link', { name: evaluation.name!, exact: true }).click();
    }
    await expect(page.locator('[data-test="quick-action-mark-ready-for-forecasting"]')).toBeVisible();

    await page.goto(workflowUrl);
    await page.getByRole('button', { name: 'Open prediction setups', exact: true }).click();
    await expect(page).toHaveURL(/\/predictions$/);
    await expect(page.getByRole('heading', { name: 'Ready to predict' })).toBeVisible();
});

test('recovers a failed dataset read and rejects a stale dataset link', async ({ page }) => {
    await page.route('**/v1/crud/datasets', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Dataset service temporarily unavailable' }),
    }));
    await page.goto('/#/workflow?datasetId=missing');
    await expect(page.getByText('Could not load datasets', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Evaluate models', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Open prediction setups', exact: true })).toBeEnabled();

    await page.unroute('**/v1/crud/datasets');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByText('Dataset unavailable', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review results', exact: true })).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Inspect selected dataset' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Open prediction setups', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ready to predict' })).toBeVisible();
});
