import { expect, test } from '@playwright/test';
import type { BacktestRead, DataBaseResponse, JobResponse } from '@dhis2-chap/ui';
import {
    createCompletedNaiveEvaluation,
    readJson,
} from './helpers/evaluation-fixtures';

test.setTimeout(240_000);

test.describe.serial('prediction setup', () => {
    let evaluation: BacktestRead;
    let setup: DataBaseResponse;
    let predictionName: string;

    test('creates a prediction setup from an evaluation and opens its dashboard', async ({ page }) => {
        evaluation = await createCompletedNaiveEvaluation(page);
        const setupName = `E2E setup ${Date.now()}`;

        await page.goto(`/#/evaluate/${evaluation.id}`);

        await expect(page.getByRole('heading', { name: 'Evaluation details' })).toBeVisible();

        await page.locator('[data-test="quick-action-mark-ready-for-forecasting"]').click();
        await expect(page.getByRole('heading', { name: 'Create prediction setup' })).toBeVisible();

        await page.locator('[data-test="ready-configuration-name-input"] input').fill(setupName);

        const createSetupResponse = page.waitForResponse(response =>
            response.request().method() === 'POST' &&
            response.url().includes('/v1/crud/prediction-setups'),
        );

        await page.locator('[data-test="submit-mark-ready-for-forecasting-button"]').click();

        setup = await readJson<DataBaseResponse>(await createSetupResponse, 'Create prediction setup');

        await expect(page).toHaveURL(new RegExp(`/#/predictions/${setup.id}$`));
        await expect(page.getByRole('heading', { name: 'Prediction setup' })).toBeVisible();
        await expect(page.getByText(setupName)).toBeVisible();
        await expect(page.locator('[data-test="quick-action-predict"]')).toBeEnabled();
    });

    test('runs a prediction from the saved setup dashboard', async ({ page }) => {
        const latestEvaluationPeriod = evaluation.dataset?.lastPeriod;

        if (!latestEvaluationPeriod) {
            throw new Error('Evaluation is missing lastPeriod.');
        }

        predictionName = `E2E prediction ${Date.now()}`;

        await page.goto(`/#/predictions/${setup.id}`);

        await expect(page.getByRole('heading', { name: 'Prediction setup' })).toBeVisible();
        await page.locator('[data-test="quick-action-predict"]').click();

        await expect(page).toHaveURL(new RegExp(`/#/predictions/${setup.id}/new`));
        await expect(page.getByRole('heading', { name: 'Run prediction' })).toBeVisible();

        await page.locator('[data-test="prediction-name-input"] input').fill(predictionName);
        await page.locator('[data-test="prediction-absolute-period-input"]').fill(
            `${latestEvaluationPeriod.slice(0, 4)}-${latestEvaluationPeriod.slice(4, 6)}`,
        );

        const runPredictionResponse = page.waitForResponse(response =>
            response.request().method() === 'POST' &&
            response.url().includes(`/v1/crud/prediction-setups/${setup.id}/run`),
        );

        await page.locator('[data-test="prediction-start-button"]').click();

        const prediction = await readJson<JobResponse>(await runPredictionResponse, 'Run prediction');

        expect(prediction.id).toBeTruthy();
        await expect(page).toHaveURL(new RegExp(`/#/predictions/${setup.id}$`));
        await expect(page.getByText('Running job')).toBeVisible({ timeout: 30_000 });
    });

    test('opens the scoped activity page and shows rows for the saved setup', async ({ page }) => {
        await page.goto(`/#/predictions/${setup.id}/activity`);

        await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Back to prediction setup' })).toBeVisible();

        const activityTable = page.locator('table').first();
        await expect(activityTable).toBeVisible();
        await expect(activityTable.getByText(predictionName)).toBeVisible();
    });
});
