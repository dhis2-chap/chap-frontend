import { expect, test, type Page } from '@playwright/test';
import type {
    BacktestRead,
    ConfiguredModelDB,
    JobDescription,
    MakeBacktestsRequest,
    MakeBacktestsResponse,
    ModelConfigurationCreate,
    ModelTemplateRead,
} from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, readJson } from './helpers/evaluation-fixtures';
import { toDataTestKey } from '../src/utils/dataTestKey';

const selectModels = async (page: Page, names: string[]) => {
    await page.getByRole('button', { name: 'Select models', exact: true }).click();
    const modal = page.getByRole('dialog');
    for (const name of names) {
        await modal.locator(`[data-test="model-toggle-${toDataTestKey(name)}"]`).click();
    }
    return modal;
};

const removeChips = (page: Page) => page.locator('[data-test^="selected-model-"][data-test$="-remove"]');

test.describe('saved dataset evaluations', () => {
    test('selects compatible models, resets on dataset change, and queues a job for each', async ({ page }) => {
        test.setTimeout(240_000);
        const evaluation: BacktestRead = await createCompletedNaiveEvaluation(page);
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
        const alternative = await createModel('compatible');
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
        await expect(removeChips(page)).toHaveCount(2);
        await removeChips(page).last().click();
        await expect(removeChips(page)).toHaveCount(1);
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

        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/analytics/create-backtests') && response.request().method() === 'POST',
        );
        await start.click();
        const response = await responsePromise;
        const request = response.request().postDataJSON() as MakeBacktestsRequest;
        expect(request).toMatchObject({ name, datasetId: evaluation.datasetId, nPeriods: 3, nSplits: 10, stride: 1 });
        expect([...request.modelIds].sort()).toEqual(['naive_model', alternative.name].sort());
        const run = await readJson<MakeBacktestsResponse>(response, 'Start saved dataset evaluation');
        const jobIds = run.jobs.map(job => job.jobId);
        expect(new Set(jobIds).size).toBe(2);
        const jobs = await readJson<JobDescription[]>(
            await page.request.get(chapUrl('/v1/jobs'), { params: new URLSearchParams(jobIds.map(id => ['ids', id])) }),
            'Load submitted evaluation jobs',
        );
        // Jobs come back in request order, one per model.
        for (const [index, model] of request.modelIds.entries()) {
            expect(jobs).toContainEqual(expect.objectContaining({ id: jobIds[index], name: `${name}/${model}`, type: 'create_backtest' }));
        }
        await expect(page).toHaveURL(/\/#\/jobs$/);
    });
});
