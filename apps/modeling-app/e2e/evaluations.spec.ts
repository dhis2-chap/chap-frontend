import { expect, test } from '@playwright/test';
import type { DataList, EvaluationEntry } from '@dhis2-chap/ui';
import type { Spec } from 'vega';
import { createCompletedNaiveEvaluation, chapUrl, readJson } from './helpers/evaluation-fixtures';

test('logs in and loads the evaluations table', async ({ page }) => {
    await page.goto('/#/evaluate');

    await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
});

test('renders predicted vs actual for the selected horizon without experimental features', async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    page.setDefaultTimeout(15_000);
    const evaluation = await createCompletedNaiveEvaluation(page);

    // Isolate the feature-flag state; all evaluation and plot data use the real API.
    await page.route('**/dataStore/modeling/experimental*', route => route.fulfill({
        json: { version: 1, enabled: false, features: { evaluationPlots: false } },
    }));
    await page.goto(`/#/evaluate/${evaluation.id}`);
    await expect(page.getByText('Evaluation plots', { exact: true })).toBeVisible();

    const entries = await readJson<EvaluationEntry[]>(
        await page.request.get(chapUrl(`/v1/analytics/evaluation-entry?backtestId=${evaluation.id}&quantiles=0.5`)),
        'Load median predictions',
    );
    const actual = await readJson<DataList>(
        await page.request.get(chapUrl(`/v1/analytics/actual-cases/${evaluation.id}`)),
        'Load actual cases',
    );

    for (const [plotId, label] of [
        ['predicted_vs_actual', 'Predicted vs Actual'],
        ['predicted_vs_actual_linear', 'Predicted vs Actual (linear)'],
    ]) {
        const visualizationSelect = page.locator('[data-test="evaluation-plot-select"]');
        await visualizationSelect.click();
        await page.getByRole('menuitem', { name: label, exact: true }).click();
        await expect(page.getByText('Please select a horizon period to view this visualization.')).toBeVisible();

        for (const horizon of [1, 2]) {
            const horizonSelect = page.locator('[data-test="evaluation-plot-horizon-select"]');
            await horizonSelect.click();
            const plotResponse = page.waitForResponse(response =>
                response.url().endsWith(`/backtest-plots/${plotId}/${evaluation.id}/subplot`) &&
                response.request().method() === 'POST',
            );
            await page.getByRole('menuitem', { name: String(horizon), exact: true }).click();
            const response = await plotResponse;
            expect(response.request().postDataJSON()).toEqual({ horizon_distance: horizon });
            const spec = await readJson<Spec>(response, 'Load predicted vs actual plot');
            const points = spec.data?.flatMap(data => 'values' in data && Array.isArray(data.values)
                ? data.values as Record<string, string | number | null>[]
                : []) ?? [];
            expect(points.length).toBeGreaterThan(0);
            for (const point of points) {
                expect(point.horizon_distance).toBe(horizon);
                const period = String(point.time_period).slice(0, 7).replace('-', '');
                const median = entries.find(entry => entry.orgUnit === point.location &&
                    entry.period === period &&
                    Number(entry.period.slice(0, 4)) * 12 + Number(entry.period.slice(4))
                    - (Number(entry.splitPeriod.slice(0, 4)) * 12 + Number(entry.splitPeriod.slice(4))) + 1 === horizon);
                expect(median?.value).toBe(point.median_forecast);
                const observation = actual.data.find(value => value.ou === point.location && value.pe === period);
                expect(observation?.value ?? null).toBe(point.disease_cases);
                if (plotId === 'predicted_vs_actual') {
                    expect(point.log1p_predicted).toBeCloseTo(Math.log1p(Number(point.median_forecast)));
                    if (point.disease_cases !== null) {
                        expect(point.log1p_actual).toBeCloseTo(Math.log1p(Number(point.disease_cases)));
                    }
                }
            }
            await expect(page.locator('.vega-embed svg.marks')).toBeVisible();
        }
        await page.locator('.vega-embed').screenshot({ path: testInfo.outputPath(`${plotId}.png`) });
    }
});
