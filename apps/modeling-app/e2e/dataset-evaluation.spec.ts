import { expect, test, type Page } from '@playwright/test';
import type {
    BacktestRead,
    ConfiguredModelDB,
    JobDescription,
    JobResponse,
    MakeBacktestRequest,
    ModelConfigurationCreate,
    ModelTemplateRead,
} from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, readJson } from './helpers/evaluation-fixtures';
import { toDataTestKey } from '../src/utils/dataTestKey';

const selectModels = async (page: Page, names: string[]) => {
    await page.getByRole('button', { name: 'Select models', exact: true }).click();
    const modal = page.getByRole('dialog');
    for (const name of names) {
        const key = toDataTestKey(name);
        await modal.locator(`[data-test="model-inspect-${key}"]`).click();
        await modal.locator(`[data-test="model-select-${key}"]`).click();
    }
    return modal;
};

// Both tests reuse the real dataset and configured models created by the first.
test.describe.serial('saved dataset evaluations', () => {
    let evaluation: BacktestRead;
    let alternative: ConfiguredModelDB;

    test('selects compatible models, resets on dataset change, and queues a job for each', async ({ page }) => {
        test.setTimeout(240_000);
        evaluation = await createCompletedNaiveEvaluation(page);
        const otherEvaluation = await createCompletedNaiveEvaluation(page, `E2E other dataset ${Date.now()}`);
        const templates = await readJson<ModelTemplateRead[]>(
            await page.request.get(chapUrl('/v1/crud/model-templates')),
            'Load model templates',
        );
        const template = templates.find(model => model.name === 'naive_model')!;
        const createModel = async (suffix: string, additionalContinuousCovariates: string[] = []) => {
            const data: ModelConfigurationCreate = {
                name: `e2e_${suffix}_${Date.now()}`,
                modelTemplateId: template.id,
                additionalContinuousCovariates,
            };
            return readJson<ConfiguredModelDB>(
                await page.request.post(chapUrl('/v1/crud/configured-models'), { data }),
                'Create configured model',
            );
        };
        alternative = await createModel('compatible');
        const incompatible = await createModel('incompatible', ['unavailable_e2e_covariate']);

        await page.goto(`/#/evaluate/from-dataset?datasetId=${evaluation.datasetId}&origin=all`);
        const start = page.getByRole('button', { name: 'Start evaluation', exact: true });
        await expect(start).toBeDisabled();
        const modal = await selectModels(page, ['naive_model', alternative.name]);
        await expect(modal.locator(`[data-test="model-inspect-${toDataTestKey(incompatible.name)}"]`)).toHaveCount(0);
        await modal.getByPlaceholder('Search models').fill('no matching model');
        await expect(modal.getByText('No models found')).toBeVisible();
        await modal.getByRole('button', { name: 'Use selected models (2)', exact: true }).click();
        await expect(modal).not.toBeVisible();
        await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(2);
        await page.getByRole('button', { name: 'Remove', exact: true }).last().click();
        await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(1);
        await selectModels(page, []);
        await modal.getByRole('button', { name: 'Use selected models (1)', exact: true }).click();

        await page.locator('[data-test="evaluation-dataset-select"]').click();
        await page.getByText(otherEvaluation.dataset.name, { exact: true }).click();
        await expect(page.getByText('No models selected', { exact: true })).toBeVisible();
        await expect(start).toBeDisabled();
        await page.locator('[data-test="evaluation-dataset-select"]').click();
        await page.getByText(evaluation.dataset.name, { exact: true }).click();
        const name = `E2E multi-model ${Date.now()}`;
        await page.locator('[data-test="evaluation-name-input"] input').fill(name);
        await selectModels(page, ['naive_model', alternative.name]);
        await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(page.getByText('No models selected', { exact: true })).toBeVisible();
        await selectModels(page, ['naive_model', alternative.name]);
        await modal.getByRole('button', { name: 'Use selected models (2)', exact: true }).click();

        const responses = ['naive_model', alternative.name].map(modelId => page.waitForResponse(response =>
            response.url().includes('/analytics/create-backtest') &&
            response.request().method() === 'POST' &&
            response.request().postDataJSON().modelId === modelId,
        ));
        await start.click();
        const jobIds: string[] = [];
        for (const responsePromise of responses) {
            const response = await responsePromise;
            expect(response.request().postDataJSON() as MakeBacktestRequest).toMatchObject({
                name, datasetId: evaluation.datasetId, nPeriods: 3, nSplits: 10, stride: 1,
            });
            const job = await readJson<JobResponse>(response, 'Start saved dataset evaluation');
            jobIds.push(job.id);
        }
        expect(new Set(jobIds).size).toBe(2);
        const jobs = await readJson<JobDescription[]>(
            await page.request.get(chapUrl('/v1/jobs'), { params: new URLSearchParams(jobIds.map(id => ['ids', id])) }),
            'Load submitted evaluation jobs',
        );
        for (const id of jobIds) {
            expect(jobs).toContainEqual(expect.objectContaining({ id, name, type: 'create_backtest' }));
        }
        await expect(page.getByText('Evaluation job started', { exact: true })).toHaveCount(2);
        await expect(start).toBeDisabled();
        await page.getByRole('button', { name: 'View jobs', exact: true }).click();
        await expect(page).toHaveURL(/\/#\/jobs$/);
    });

    test('reports partial failure and retries only the failed model', async ({ page }) => {
        const requests: MakeBacktestRequest[] = [];
        let failAlternative = true;
        // A deterministic request failure is the only mocked service behavior.
        await page.route('**/analytics/create-backtest', async (route) => {
            const body = route.request().postDataJSON() as MakeBacktestRequest;
            requests.push(body);
            if (body.modelId === alternative.name && failAlternative) {
                await route.fulfill({ status: 500, json: { detail: 'E2E submission failure' } });
            } else {
                await route.continue();
            }
        });
        await page.goto(`/#/evaluate/from-dataset?datasetId=${evaluation.datasetId}`);
        await page.locator('[data-test="evaluation-name-input"] input').fill(`E2E partial failure ${Date.now()}`);
        const modal = await selectModels(page, ['naive_model', alternative.name]);
        await modal.getByRole('button', { name: 'Use selected models (2)', exact: true }).click();
        const failureResponse = page.waitForResponse(response => response.status() === 500 && response.url().includes('/analytics/create-backtest'));
        await page.getByRole('button', { name: 'Start evaluation', exact: true }).click();
        await failureResponse;
        await expect(page.getByText('Evaluation job started', { exact: true })).toHaveCount(1);
        await expect(page.getByText(/Could not start evaluation:/)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(1);

        failAlternative = false;
        const retryResponse = page.waitForResponse(response => response.url().includes('/analytics/create-backtest') && response.ok());
        await page.getByRole('button', { name: 'Start evaluation', exact: true }).click();
        expect((await retryResponse).request().postDataJSON().modelId).toBe(alternative.name);
        await expect(page.getByText('Evaluation job started', { exact: true })).toHaveCount(1);
        expect(requests).toHaveLength(3);
        expect(requests.slice(0, 2).map(request => request.modelId)).toEqual(expect.arrayContaining(['naive_model', alternative.name]));
        expect(requests[2].modelId).toBe(alternative.name);
        await expect(page.getByRole('button', { name: 'Start evaluation', exact: true })).toBeDisabled();
    });
});
