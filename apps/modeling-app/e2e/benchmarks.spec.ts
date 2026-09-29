import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { BacktestSpecificationRead, MakeBacktestsRequest, MakeBacktestsResponse, ModelSpecRead } from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, readJson } from './helpers/evaluation-fixtures';
import { toDataTestKey } from '../src/utils/dataTestKey';

test('compares runs, exports scores and adds a model to the same benchmark', async ({ page }) => {
    test.setTimeout(240_000);
    const evaluation = await createCompletedNaiveEvaluation(page, `E2E benchmark ${Date.now()}`);
    const specification = await readJson<BacktestSpecificationRead>(
        await page.request.get(chapUrl(`/v1/crud/backtest-specifications/${evaluation.specificationId}`)),
        'Load benchmark',
    );
    const model = evaluation.configuredModel!;
    const models = await readJson<ModelSpecRead[]>(await page.request.get(chapUrl('/v1/crud/configured-models')), 'Load configured models');
    const modelDisplayName = models.find(({ id }) => id === model.id)?.displayName || model.name;

    // Datasets created by an evaluation are hidden until the origin filter is widened.
    await page.goto('/#/evaluate/benchmarks');
    await expect(page.getByRole('columnheader', { name: 'Model runs', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: evaluation.dataset.name, exact: true })).toHaveCount(0);
    await page.goto('/#/evaluate/benchmarks?origin=all');
    await page.getByRole('link', { name: evaluation.dataset.name, exact: true }).click();
    await expect(page).toHaveURL(`/#/evaluate/benchmarks/${specification.id}`);
    await expect(page.getByRole('navigation', { name: 'Breadcrumbs' }).locator('[aria-current="page"]')).toHaveText(evaluation.dataset.name);
    await expect(page.locator(`[data-test="view-evaluation-${evaluation.id}"]`)).toBeVisible();
    await page.getByRole('button', { name: 'Add models', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Run models', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Select models', exact: true }).click();
    const modal = page.getByRole('dialog');
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
    await expect.poll(async () => {
        const jobResponse = await page.request.get(chapUrl(`/v1/jobs/${result.jobs[0].jobId}`));
        const status = await readJson<string>(jobResponse, 'Load model run status');
        if (['FAILURE', 'REVOKED'].includes(status)) {
            throw new Error(`Benchmark model failed: ${await (await page.request.get(chapUrl(`/v1/jobs/${result.jobs[0].jobId}/logs`))).text()}`);
        }
        return status;
    }, { timeout: 180_000, intervals: [3000] }).toBe('SUCCESS');
    // Job completion must refresh the benchmarks without a manual reload.
    await expect(page.getByRole('button', { name: 'View evaluation', exact: true })).toHaveCount(2, { timeout: 20_000 });
    await expect(page.getByRole('cell', { name: modelDisplayName, exact: true })).toHaveCount(2);
    await expect(page.locator('[title="Best score among these runs"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'View evaluation', exact: true }).last()).toHaveAttribute('data-test', `view-evaluation-${evaluation.id}`);

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
});
