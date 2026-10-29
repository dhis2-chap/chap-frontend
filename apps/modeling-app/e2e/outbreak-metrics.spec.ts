import { expect, test } from '@playwright/test';
import type { AlertPolicyCreate, BacktestRead, DataBaseResponse, OutbreakMetricsResponse } from '@dhis2-chap/ui';
import { chapUrl, createCompletedNaiveEvaluation, getChap, readJson } from './helpers/evaluation-fixtures';

test.setTimeout(240_000);

test.describe.serial('outbreak detection scores', () => {
    let evaluation: BacktestRead;
    let policyId: number;
    const policyName = `E2E outbreak metrics ${Date.now()}`;

    test.beforeEach(async ({ page }) => {
        const response = await getChap(page, '/v1/analytics/outbreak-metrics');
        expect([200, 404]).toContain(response.status());
        test.skip(response.status() === 404, 'Chap Core predates policy-based outbreak metrics');
    });

    test('scores a selected policy, expands metrics and recomputes by horizon', async ({ page }) => {
        evaluation = await createCompletedNaiveEvaluation(page, `E2E outbreak evaluation ${Date.now()}`);
        const policy: AlertPolicyCreate = {
            name: policyName,
            levels: [
                { name: 'Watch', outputCode: '1', thresholdParams: { type: 'percentile', quantile: 0.5 }, exceedanceThreshold: 0.5 },
                { name: 'Action', outputCode: '2', thresholdParams: { type: 'percentile', quantile: 0.9 }, exceedanceThreshold: 0.75 },
            ],
        };
        policyId = (await readJson<DataBaseResponse>(await page.request.post(chapUrl('/v1/crud/alert-policies'), {
            data: policy,
        }), 'Create outbreak policy')).id;

        await page.goto(`/#/evaluate/${evaluation.id}`);
        const widget = page.locator('[data-test="outbreak-metrics"]');
        await expect(widget.getByText('Alert policy', { exact: true })).toBeVisible();
        await expect(widget.getByRole('table')).toHaveCount(0);
        await widget.locator('[data-test="outbreak-policy"]').click();
        const scored = page.waitForResponse(response => response.url().includes(`/backtests/${evaluation.id}/outbreak-metrics?`));
        await page.getByText(policyName, { exact: true }).click();
        const response = await scored;
        expect(new URL(response.url()).searchParams.get('alertPolicyId')).toBe(String(policyId));
        const scores = await readJson<OutbreakMetricsResponse>(response, 'Score outbreak detection');
        expect(scores.rows[0].nCells).toBeGreaterThan(0);
        await expect(widget.getByRole('heading', { name: 'All forecast horizons' })).toBeVisible();
        await expect(widget.getByRole('columnheader', { name: 'Accuracy', exact: true })).toHaveCount(0);
        await widget.getByRole('button', { name: 'Show all metrics', exact: true }).click();
        await expect(widget.getByRole('columnheader', { name: 'MCC', exact: true })).toBeVisible();

        // Check every displayed per-level score against the actual API response, including undefined ratios.
        for (const level of scores.rows[0].levels) {
            const row = widget.getByRole('row').filter({ has: page.getByRole('cell', { name: level.level, exact: true }) });
            // A baseline comparison ("vs …") follows each score when the specification has a baseline run.
            const values = (await row.getByRole('cell').allTextContents()).map(value => value.replace(/vs .*$/, ''));
            expect(values.slice(2)).toEqual(Object.values(level.metrics).map(value => value == null
                ? 'Not defined'
                : value.toLocaleString('en-US', { maximumFractionDigits: 3 })));
        }
        await expect(widget.getByText('Macro F1', { exact: true })).toBeVisible();
        await expect(widget.getByText('Weighted kappa', { exact: true })).toBeVisible();
        await expect(widget.getByText('Categorical accuracy', { exact: true })).toBeVisible();

        const grouped = page.waitForResponse(response => response.url().includes('/outbreak-metrics?') && response.url().includes('groupBy=horizon_distance'));
        await widget.getByLabel('Split by horizon', { exact: true }).check();
        const horizons = await readJson<OutbreakMetricsResponse>(await grouped, 'Score forecast horizons');
        expect(horizons.rows.length).toBeGreaterThan(1);
        expect(horizons.rows.reduce((total, row) => total + row.nCells, 0)).toBe(scores.rows[0].nCells);
        await expect(widget.getByRole('table')).toHaveCount(horizons.rows.length);
        for (const row of horizons.rows) {
            await expect(widget.getByRole('heading', { name: `Horizon ${row.horizonDistance}`, exact: true })).toBeVisible();
        }

        await widget.getByRole('button', { name: 'Show fewer metrics', exact: true }).click();
        await expect(widget.getByRole('columnheader', { name: 'MCC', exact: true })).toHaveCount(0);
    });

    test('shows a scoring error and retries without losing the selected policy', async ({ page }) => {
        // A transient service failure cannot be triggered reliably against the real backend.
        const endpoint = `**/backtests/${evaluation.id}/outbreak-metrics?*`;
        await page.route(endpoint, route => route.fulfill({ status: 503, json: { detail: 'Temporarily unavailable' } }));
        await page.goto(`/#/evaluate/${evaluation.id}`);
        const widget = page.locator('[data-test="outbreak-metrics"]');
        await widget.locator('[data-test="outbreak-policy"]').click();
        await page.getByText(policyName, { exact: true }).click();
        await expect(widget.getByText('Could not score outbreak detection', { exact: true })).toBeVisible();
        await expect(widget.getByRole('table')).toHaveCount(0);
        await page.unroute(endpoint);
        const retried = page.waitForResponse(response => response.url().includes(`/backtests/${evaluation.id}/outbreak-metrics?`));
        await widget.getByRole('button', { name: 'Retry', exact: true }).click();
        expect((await retried).ok()).toBe(true);
        await expect(widget.getByRole('table')).toHaveCount(1);
        await expect(widget.locator('[data-test="outbreak-policy"]')).toContainText(policyName);
    });
});
