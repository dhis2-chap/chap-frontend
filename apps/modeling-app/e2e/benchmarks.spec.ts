import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { BacktestSpecificationRead, MakeBacktestsRequest, MakeBacktestsResponse, ModelSpecRead, SelectionBias } from '@dhis2-chap/ui';
import { getChap, getJobStatus, createCompletedNaiveEvaluation, readJson } from './helpers/evaluation-fixtures';
import { toDataTestKey } from '../src/utils/dataTestKey';
import { isVersionCompatible } from '../src/utils/compareVersions';

test('starts model runs from New benchmark and groups them by dataset and parameters', async ({ page }) => {
    test.setTimeout(240_000);
    const { chap_core_version: chapVersion } = await readJson<{ chap_core_version: string }>(
        await getChap(page, '/system/info'),
        'Load Chap Core version',
    );
    test.skip(!isVersionCompatible(chapVersion, '2.4.0'), 'Benchmarks need Chap Core >= 2.4.0');
    const evaluation = await createCompletedNaiveEvaluation(page, `E2E new benchmark ${Date.now()}`);

    await page.goto('/#/evaluate/benchmarks');
    await page.getByRole('button', { name: 'New benchmark', exact: true }).click();
    await expect(page).toHaveURL('/#/evaluate/benchmarks/new');
    await expect(page.getByRole('heading', { name: 'New benchmark', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumbs' }).locator('[aria-current="page"]')).toHaveText('New benchmark');
    await page.getByRole('button', { name: 'Back to benchmarks', exact: true }).click();
    await expect(page).toHaveURL('/#/evaluate/benchmarks');
    await page.getByRole('button', { name: 'New benchmark', exact: true }).click();

    const start = page.getByRole('button', { name: 'Run benchmark', exact: true });
    await expect(start).toBeDisabled();
    await expect(page.getByText('Runs with the same dataset, target column and backtest parameters appear in the same benchmark.', { exact: false })).toBeVisible();
    // The fixture's dataset counts as created by an evaluation only on some Chap versions.
    if (evaluation.dataset.createdManually === false) {
        await page.getByText('Created manually', { exact: true }).click();
        await page.getByText('Created by evaluations or predictions', { exact: true }).click();
    }
    await page.locator('[data-test="evaluation-dataset-select"]').click();
    await page.getByText(evaluation.dataset.name, { exact: true }).click();
    // Match the fixture's parameters so the backend reuses its benchmark.
    for (const [field, value] of Object.entries({ nPeriods: 3, nSplits: 10, stride: 1 })) {
        await page.locator(`[data-test="backtest-${field}"] input`).fill(String(value));
    }
    const name = `E2E benchmark runs ${Date.now()}`;
    await page.locator('[data-test="evaluation-name-input"] input').fill(name);
    await page.getByRole('button', { name: 'Select models', exact: true }).click();
    const modal = page.getByRole('dialog');
    await modal.locator(`[data-test="model-toggle-${toDataTestKey('naive_model')}"]`).click();
    await modal.getByRole('button', { name: 'Use selected models (1)', exact: true }).click();

    const responsePromise = page.waitForResponse(response => response.url().endsWith('/v1/analytics/create-backtests') && response.request().method() === 'POST');
    await start.click();
    const response = await responsePromise;
    expect(response.request().postDataJSON()).toMatchObject({
        name, datasetId: evaluation.datasetId, modelIds: ['naive_model'], nPeriods: 3, nSplits: 10, stride: 1,
    });
    const result = await readJson<MakeBacktestsResponse>(response, 'Run new benchmark');
    expect(result.specificationId).toBe(evaluation.specificationId);
    await expect(page).toHaveURL(`/#/evaluate/benchmarks/${result.specificationId}`);
    await expect.poll(async () => {
        const status = await getJobStatus(page, result.jobs[0].jobId, 'Load benchmark run status');
        if (['FAILURE', 'REVOKED'].includes(status)) {
            throw new Error(`Benchmark run failed: ${await (await getChap(page, `/v1/jobs/${result.jobs[0].jobId}/logs`)).text()}`);
        }
        return status;
    }, { timeout: 180_000, intervals: [3000] }).toBe('SUCCESS');
    // The fixture evaluation and the new run.
    await expect(page.getByRole('button', { name: 'View evaluation', exact: true }).nth(1)).toBeVisible({ timeout: 20_000 });
});

test('uses benchmark actions to view, add models, export scores and reuse the dataset', async ({ page }) => {
    test.setTimeout(240_000);
    const { chap_core_version: chapVersion } = await readJson<{ chap_core_version: string }>(
        await getChap(page, '/system/info'),
        'Load Chap Core version',
    );
    test.skip(!isVersionCompatible(chapVersion, '2.4.0'), 'Benchmarks need Chap Core >= 2.4.0');
    const evaluation = await createCompletedNaiveEvaluation(page, `E2E benchmark ${Date.now()}`);
    const specification = await readJson<BacktestSpecificationRead>(
        await getChap(page, `/v1/crud/backtest-specifications/${evaluation.specificationId}`),
        'Load benchmark',
    );
    const model = evaluation.configuredModel!;
    const models = await readJson<ModelSpecRead[]>(await getChap(page, '/v1/crud/configured-models'), 'Load configured models');
    const modelDisplayName = models.find(({ id }) => id === model.id)?.displayName || model.name;

    // The fixture now imports a saved dataset first; its origin flag depends on the Chap version.
    await page.goto('/#/evaluate/benchmarks');
    await expect(page.getByRole('columnheader', { name: 'Model runs', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: evaluation.dataset.name, exact: true })).toHaveCount(specification.dataset.createdManually === false ? 0 : 1);
    await page.goto('/#/evaluate/benchmarks?origin=all');
    await expect(page.getByRole('columnheader').last()).toHaveText('Actions');
    const actions = page.locator(`[data-test="benchmark-actions-${specification.id}"]`);
    await actions.click();
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await expect(page).toHaveURL(`/#/evaluate/benchmarks/${specification.id}`);
    await expect(page.getByRole('navigation', { name: 'Breadcrumbs' }).locator('[aria-current="page"]')).toHaveText(evaluation.dataset.name);
    await expect(page.locator(`[data-test="view-evaluation-${evaluation.id}"]`)).toBeVisible();
    await page.goBack();
    await actions.click();
    await page.getByRole('menuitem', { name: 'New evaluation from this dataset', exact: true }).click();
    await expect(page).toHaveURL(`/#/evaluate/from-dataset?datasetId=${specification.dataset.id}`);
    await expect(page.locator('[data-test="evaluation-dataset-select"]')).toContainText(evaluation.dataset.name);

    await page.goto('/#/evaluate/benchmarks?origin=all');
    await actions.click();
    await page.getByRole('menuitem', { name: 'Add models', exact: true }).click();
    await expect(page).toHaveURL(`/#/evaluate/benchmarks/${specification.id}?addModels=true`);
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page).toHaveURL(`/#/evaluate/benchmarks/${specification.id}`);
    await expect(modal).toHaveCount(0);
    await page.getByRole('button', { name: 'Add models', exact: true }).click();
    await modal.locator(`[data-test="model-toggle-${toDataTestKey(model.name)}"]`).click();
    await modal.getByRole('button', { name: 'Use selected models (1)', exact: true }).click();
    await expect(page.getByText('Already run with this version', { exact: true })).toBeVisible();

    const responsePromise = page.waitForResponse(response => response.url().endsWith('/v1/analytics/create-backtests') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Run models', exact: true }).click();
    const response = await responsePromise;
    const request = response.request().postDataJSON() as MakeBacktestsRequest;
    expect(request).toMatchObject({
        datasetId: specification.dataset.id, modelIds: [model.id],
        nPeriods: specification.nPeriods, nSplits: specification.nSplits,
        stride: specification.stride, nRetrain: specification.nRetrain,
        futureWeatherProvider: specification.futureWeatherProvider,
    });
    const result = await readJson<MakeBacktestsResponse>(response, 'Run benchmark model');
    expect(result.specificationId).toBe(specification.id);
    await expect(page.getByText('Model runs queued', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(`/#/evaluate/benchmarks/${specification.id}`);
    await expect.poll(async () => {
        const status = await getJobStatus(page, result.jobs[0].jobId, 'Load model run status');
        if (['FAILURE', 'REVOKED'].includes(status)) {
            throw new Error(`Benchmark model failed: ${await (await getChap(page, `/v1/jobs/${result.jobs[0].jobId}/logs`)).text()}`);
        }
        return status;
    }, { timeout: 180_000, intervals: [3000] }).toBe('SUCCESS');
    // Job completion must refresh the benchmarks without a manual reload.
    await expect(page.getByRole('cell', { name: modelDisplayName, exact: true })).toHaveCount(2, { timeout: 20_000 });
    await expect(page.locator('[title="Best score among these runs"]').first()).toBeVisible();
    // Newest run first, then the fixture evaluation.
    await expect(page.getByRole('button', { name: 'View evaluation', exact: true }).nth(1)).toHaveAttribute('data-test', `view-evaluation-${evaluation.id}`);

    // Chap Core 2.6 queues the baselines when the benchmark is first read and compares every run with those that are done.
    if (isVersionCompatible(chapVersion, '2.6.0')) {
        await expect.poll(async () => {
            const current = await readJson<BacktestSpecificationRead>(await getChap(page, `/v1/crud/backtest-specifications/${specification.id}`), 'Load baselines');
            return current.baselines?.some(baseline => baseline.status === 'done') ?? false;
        }, { timeout: 120_000, intervals: [3000] }).toBe(true);
        await page.reload();
        await page.getByText('Compare with baseline', { exact: true }).click();
        await expect(page.getByText('Positive means better than', { exact: false })).toBeVisible();
        await expect(page.getByRole('cell', { name: /^[+-]\d/ }).first()).toBeVisible();
        await page.getByText('Compare with baseline', { exact: true }).click();
        await expect(page.getByText('Best only means best among these runs', { exact: false })).toBeVisible();
    }

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`benchmark-${specification.id}.csv`);
    const csv = await readFile((await download.path())!, 'utf8');
    expect(csv).toContain('"mae"');
    expect(csv).toContain(`"${model.name}"`);
    expect(csv).toContain('"future_weather_provider"');
    await page.locator(`[data-test="view-evaluation-${evaluation.id}"]`).click();
    await expect(page).toHaveURL(`/#/evaluate/${evaluation.id}`);

    await page.goto('/#/evaluate/benchmarks?origin=all');
    await actions.click();
    const overviewDownloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: 'Download CSV', exact: true }).click();
    const overviewDownload = await overviewDownloadPromise;
    expect(overviewDownload.suggestedFilename()).toBe(`benchmark-${specification.id}.csv`);
    expect(await readFile((await overviewDownload.path())!, 'utf8')).toBe(csv);
    await expect(page).toHaveURL('/#/evaluate/benchmarks?origin=all');
});

test('says whether the best model is ahead of the others by more than luck', async ({ page }) => {
    test.setTimeout(240_000);
    const { chap_core_version: chapVersion } = await readJson<{ chap_core_version: string }>(
        await getChap(page, '/system/info'),
        'Load Chap Core version',
    );
    test.skip(!isVersionCompatible(chapVersion, '2.9.0'), 'The selection bias needs Chap Core >= 2.9.0');
    const evaluation = await createCompletedNaiveEvaluation(page, `E2E selection bias ${Date.now()}`);
    const [run] = (await readJson<BacktestSpecificationRead>(
        await getChap(page, `/v1/crud/backtest-specifications/${evaluation.specificationId}`),
        'Load benchmark',
    )).backtests;
    // The test stack can only run the naive model, so a second model is added to the benchmark
    // here, and Chap Core's answers about it are given as Chap Core 2.9.0 gives them.
    const other = { ...run, id: run.id + 100_000, configuredModel: { ...run.configuredModel!, id: run.configuredModel!.id + 100_000, name: 'e2e_other_model' } };
    await page.route(`**/v1/crud/backtest-specifications/${evaluation.specificationId}?**`, async (route) => {
        const response = await route.fetch();
        const specification = await response.json() as BacktestSpecificationRead;
        await route.fulfill({ response, json: { ...specification, backtests: [...specification.backtests, other] } });
    });
    const biasRequests: URL[] = [];
    await page.route('**/selection-bias?**', async (route) => {
        const url = new URL(route.request().url());
        biasRequests.push(url);
        if (!url.searchParams.has('horizonDistance')) {
            await route.fulfill({ status: 422, json: { detail: 'Too few split points (10): only 31% of the draws leave out a split point to score, and at least half must.' } });
            return;
        }
        const selectionBias: SelectionBias = {
            metricId: 'crps_log1p', baselineModel: 'persistence', comparisonDescription: '', horizonDistances: [1], gapSplits: 0,
            splitPeriods: [], selectedBacktestId: other.id, validationValue: 0.2, estimatedBias: 0.05, estimatedValue: 0.15,
            blockSize: 3, nDraws: 2000, nDrawsScored: 1900,
            candidates: [
                { backtestId: other.id, configuredModelId: other.configuredModel.id, modelName: other.configuredModel.name, validationValue: 0.2, nDrawsPicked: 1520 },
                { backtestId: run.id, configuredModelId: run.configuredModel!.id, modelName: run.configuredModel!.name, validationValue: 0.1, nDrawsPicked: 380 },
            ],
        };
        await route.fulfill({ json: selectionBias });
    });

    await page.goto(`/#/evaluate/benchmarks/${evaluation.specificationId}`);
    const summary = page.locator('[data-test="selection-bias"]');
    await expect(summary.getByRole('heading', { name: 'Is the best model ahead of the others by more than luck?' })).toBeVisible({ timeout: 30_000 });
    await expect(summary.locator('[data-test="selection-bias-answer"]')).toHaveText('e2e_other_model came out best in 1,520 of 1,900 redraws of the evaluation, so part of its lead may be luck.');
    await expect(summary).toContainText('Forecasts one period ahead:');
    await expect(summary).toContainText('only forecasts one period ahead were checked');
    // Every period ahead first, as on the leaderboard, then one period ahead when Chap Core says there are too few splits.
    expect(biasRequests.map(url => url.searchParams.get('horizonDistance'))).toEqual([null, '1']);
    expect(biasRequests[0].pathname).toContain(`/v1/crud/backtest-specifications/${evaluation.specificationId}/selection-bias`);
});
