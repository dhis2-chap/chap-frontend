import { expect, test } from '@playwright/test';
import type { BacktestRead, DataBaseResponse, JobDescription, JobResponse } from '@dhis2-chap/ui';
import {
    createCompletedNaiveEvaluation,
    readJson,
} from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';

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

    test('streams prediction logs on the dashboard and retains final model output after failure', async ({ page }) => {
        const latestEvaluationPeriod = evaluation.dataset?.lastPeriod;

        if (!latestEvaluationPeriod) {
            throw new Error('Evaluation is missing lastPeriod.');
        }

        predictionName = `E2E prediction ${Date.now()}`;

        await page.clock.install();
        let status = 'PENDING';
        let logs = '';
        let logRequests = 0;
        // Keep real setup/submission, but control this job's timing and failure:
        // the naive model normally finishes too quickly to observe live logs.
        await page.route(`**/v1/crud/prediction-setups/${setup.id}/run`, async (route) => {
            const response = await route.fetch();
            const job = await readJson<JobResponse>(response, 'Run prediction');
            await page.route('**/v1/jobs?*', async (jobsRoute) => {
                const jobsResponse = await jobsRoute.fetch();
                const jobs = await readJson<JobDescription[]>(jobsResponse, 'Load prediction jobs');
                await jobsRoute.fulfill({
                    json: jobs.map(item => item.id === job.id ? { ...item, status } : item),
                });
            });
            await page.route(`**/v1/jobs/${job.id}/logs`, (route) => {
                logRequests += 1;
                return route.fulfill({ contentType: 'application/json', body: JSON.stringify(logs) });
            });
            await route.fulfill({ response });
        }, { times: 1 });

        await page.goto(`/#/predictions/${setup.id}`);

        await expect(page.getByRole('heading', { name: 'Prediction setup' })).toBeVisible();
        await page.locator('[data-test="quick-action-predict"]').click();

        await expect(page).toHaveURL(new RegExp(`/#/predictions/${setup.id}/new`));
        await expect(page.getByRole('heading', { name: 'Run prediction' })).toBeVisible();

        await page.locator('[data-test="prediction-name-input"] input').fill(predictionName);
        await selectPeriod(page, 'prediction-absolute-period-input', latestEvaluationPeriod);

        const runPredictionResponse = page.waitForResponse(response =>
            response.request().method() === 'POST' &&
            response.url().includes(`/v1/crud/prediction-setups/${setup.id}/run`),
        );

        await page.locator('[data-test="prediction-start-button"]').click();

        const prediction = await readJson<JobResponse>(await runPredictionResponse, 'Run prediction');

        expect(prediction.id).toBeTruthy();
        await expect(page).toHaveURL(new RegExp(`/#/predictions/${setup.id}$`));
        await expect(page.getByText('Running job')).toBeVisible({ timeout: 30_000 });
        const logsWidget = page.locator('[data-test="widget-contents"]').filter({ has: page.locator('pre') });
        const logOutput = logsWidget.locator('pre');
        await expect(page.getByText('Prediction job logs', { exact: true })).toBeVisible();
        await expect(logOutput).toHaveText('No logs reported for this job');

        status = 'STARTED';
        logs = 'Preparing prediction dataset';
        await expect(logOutput).toHaveText(logs, { timeout: 15_000 });
        logs += '\nRunning model';
        await expect(logOutput).toHaveText(logs, { timeout: 15_000 });

        logs += '\nModel stdout: fitting prediction\nModel stderr: prediction failed\nTraceback: model exited with code 1';
        status = 'FAILURE';
        await expect(logOutput).toHaveText(logs, { timeout: 15_000 });
        await expect(logsWidget.getByText('Failed', { exact: true })).toBeVisible();
        await expect(page.getByText('Running job')).not.toBeVisible();

        const finalLogRequests = logRequests;
        await page.clock.fastForward(30_000);
        expect(logRequests).toBe(finalLogRequests);
        await expect(logOutput).toHaveText(logs);

        // Direct visits still expose the failed job without navigation state.
        await page.goto('/#/predictions');
        await page.goto(`/#/predictions/${setup.id}`);
        await expect(logOutput).toHaveText(logs);
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
