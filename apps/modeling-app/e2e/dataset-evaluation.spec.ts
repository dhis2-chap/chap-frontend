import { expect, test, type Page, type Response } from '@playwright/test';
import type {
    BacktestRead,
    ConfiguredModelDB,
    DataBaseResponse,
    JobDescription,
    JobResponse,
    MakeBacktestRequest,
    MakeBacktestsRequest,
    MakeBacktestsResponse,
    ModelConfigurationCreate,
    ModelTemplateRead,
} from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, pollEvaluationJob, readJson } from './helpers/evaluation-fixtures';
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
        // Stable CHAP releases predate the weather registry and stored parameters.
        const providersResponse = await page.request.get(chapUrl('/v1/analytics/weather-providers'));
        expect([200, 404]).toContain(providersResponse.status());
        const supportsWeatherProviders = providersResponse.ok();
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

        const parameters = {
            nPeriods: 2, nSplits: 4, stride: 2, nRetrain: 2,
            futureWeatherProvider: supportsWeatherProviders ? 'damped_persistence' : 'climatology',
        };
        for (const [field, value] of Object.entries(parameters).filter(([field]) => field !== 'futureWeatherProvider')) {
            await page.locator(`[data-test="backtest-${field}"] input`).fill(String(value));
        }
        // The minimum dataset length must follow the chosen configuration.
        await page.locator('[data-test="backtest-nPeriods"] input').fill('1000');
        await expect(page.getByText('Dataset too short', { exact: true })).toBeVisible();
        await expect(start).toBeDisabled();
        await page.locator('[data-test="backtest-nPeriods"] input').fill('2');
        await expect(page.getByText('Dataset too short', { exact: true })).not.toBeVisible();
        if (supportsWeatherProviders) {
            await page.locator('[data-test="backtest-futureWeatherProvider"]').click();
            await page.getByText('Damped persistence', { exact: true }).click();
        }

        // Chap Core >= 2.4.0 queues every model in one create-backtests call; older versions get one create-backtest call per model.
        const responses: Response[] = [];
        page.on('response', (response) => {
            if (/\/analytics\/create-backtests?$/.test(response.url()) && response.request().method() === 'POST') {
                responses.push(response);
            }
        });
        await start.click();
        await expect(page).toHaveURL(/\/#\/jobs$/);
        const modelIds = ['naive_model', alternative.name];
        const submissions = await Promise.all(responses.map(async (response) => {
            const request = response.request().postDataJSON() as MakeBacktestsRequest | MakeBacktestRequest;
            expect(request).toMatchObject({ datasetId: evaluation.datasetId, ...parameters });
            if ('modelIds' in request) {
                const run = await readJson<MakeBacktestsResponse>(response, 'Start saved dataset evaluation');
                expect(request.name).toBe(name);
                return request.modelIds.map((model, index) => ({ model, jobId: run.jobs[index].jobId }));
            }
            const job = await readJson<JobResponse>(response, 'Start saved dataset evaluation');
            expect(request.name).toBe(`${name}/${request.modelId}`);
            return [{ model: request.modelId, jobId: job.id }];
        }));
        const queued = submissions.flat();
        expect(queued.map(({ model }) => model).sort()).toEqual([...modelIds].sort());
        const jobIds = queued.map(({ jobId }) => jobId);
        expect(new Set(jobIds).size).toBe(2);
        const jobs = await readJson<JobDescription[]>(
            await page.request.get(chapUrl('/v1/jobs'), { params: new URLSearchParams(jobIds.map(id => ['ids', id])) }),
            'Load submitted evaluation jobs',
        );
        for (const { model, jobId } of queued) {
            expect(jobs).toContainEqual(expect.objectContaining({ id: jobId, name: `${name}/${model}`, type: 'create_backtest' }));
        }
        if (supportsWeatherProviders) {
            await pollEvaluationJob(page, queued[0].jobId);
            const result = await readJson<DataBaseResponse>(
                await page.request.get(chapUrl(`/v1/jobs/${queued[0].jobId}/database_result`)),
                'Load evaluation result',
            );
            await page.goto(`/#/evaluate/${result.id}`);
            for (const [label, value] of [
                ['Forecast periods', '2'], ['Number of splits', '4'], ['Stride', '2'],
                ['Number of retrains', '2'], ['Future-weather provider', 'damped_persistence'],
            ]) {
                const row = page.locator('[data-test="backtest-parameter-summary"]').filter({ hasText: label });
                await expect(row.locator('span').last()).toHaveText(value);
            }
        }
    });
});
