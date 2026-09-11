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

    const observed = new Map(actual.data.map(value => [`${value.ou} ${value.pe}`, value.value]));
    const monthIndex = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(4));
    const horizonOf = (entry: EvaluationEntry) => monthIndex(entry.period) - monthIndex(entry.splitPeriod) + 1;
    const pointKey = (point: Record<string, string | number | null>) =>
        `${point.location} ${String(point.time_period).slice(0, 7).replace('-', '')}`;

    await page.locator('[data-test="evaluation-plot-select"]').click();
    await page.getByRole('menuitem', { name: 'Predicted vs Actual', exact: true }).click();
    await expect(page.getByText('Please select a horizon period to view this visualization.')).toBeVisible();

    for (const horizon of [1, 2]) {
        await page.locator('[data-test="evaluation-plot-horizon-select"]').click();
        const plotResponse = page.waitForResponse(response =>
            response.url().endsWith(`/backtest-plots/predicted_vs_actual/${evaluation.id}/subplot`) &&
            response.request().method() === 'POST',
        );
        await page.getByRole('menuitem', { name: String(horizon), exact: true }).click();
        const response = await plotResponse;
        expect(response.request().postDataJSON()).toEqual({ horizon_distance: horizon });

        const spec = await readJson<Spec>(response, 'Load predicted vs actual plot');
        const points = (spec.data?.flatMap(data => 'values' in data && Array.isArray(data.values)
            ? data.values as Record<string, string | number | null>[]
            : []) ?? []).filter(point => 'median_forecast' in point);

        // The plot inner-joins forecasts with observations, so it holds exactly the
        // org unit / period pairs this horizon forecast that also have an actual value.
        // Comparing the whole set catches a dropped horizon filter, which mixes in pairs
        // that only other horizons forecast. `horizon_distance` is deliberately not
        // asserted per point: chap-core below 2.2.0 compiles specs through vegafusion,
        // which prunes columns no encoding references.
        const expectedEntries = entries.filter(entry =>
            horizonOf(entry) === horizon && observed.has(`${entry.orgUnit} ${entry.period}`));
        const medians = new Map(expectedEntries.map(entry => [`${entry.orgUnit} ${entry.period}`, entry.value]));
        expect(medians.size).toBeGreaterThan(0);
        expect(new Set(points.map(pointKey))).toEqual(new Set(medians.keys()));

        for (const point of points) {
            expect(point.median_forecast).toBe(medians.get(pointKey(point)));
            expect(point.disease_cases).toBe(observed.get(pointKey(point)) ?? null);
            expect(point.log1p_predicted).toBeCloseTo(Math.log1p(Number(point.median_forecast)));
            if (point.disease_cases !== null) {
                expect(point.log1p_actual).toBeCloseTo(Math.log1p(Number(point.disease_cases)));
            }
        }
        await expect(page.locator('.vega-embed svg.marks')).toBeVisible();
    }
    await page.locator('.vega-embed').screenshot({ path: testInfo.outputPath('predicted-vs-actual.png') });
});
