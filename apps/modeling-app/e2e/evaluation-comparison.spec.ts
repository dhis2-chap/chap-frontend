import { expect, test } from '@playwright/test';
import type { BacktestDomain, BacktestRead } from '@dhis2-chap/ui';
import {
    chapUrl,
    createCompletedNaiveEvaluation,
    readJson,
} from './helpers/evaluation-fixtures';

test.setTimeout(240_000);

const createdEvaluationIds: number[] = [];

test.afterEach(async ({ request }) => {
    await Promise.all(
        createdEvaluationIds.map(async (evaluationId) => {
            const response = await request.delete(
                chapUrl(`/v1/crud/backtests/${evaluationId}`),
            );

            expect(response.ok()).toBe(true);
        }),
    );
    createdEvaluationIds.length = 0;
});

test('compares two completed evaluations and restores the comparison from the URL', async ({
    page,
}) => {
    const runId = Date.now();
    const baseEvaluationName = `E2E comparison base ${runId}`;
    const comparisonEvaluationName = `E2E comparison candidate ${runId}`;
    const baseEvaluation = await createCompletedNaiveEvaluation(
        page,
        baseEvaluationName,
    );
    createdEvaluationIds.push(baseEvaluation.id);

    const comparisonEvaluation = await createCompletedNaiveEvaluation(
        page,
        comparisonEvaluationName,
    );
    createdEvaluationIds.push(comparisonEvaluation.id);

    await page.goto(`/#/evaluate/${baseEvaluation.id}`);
    await expect(
        page.getByRole('heading', { name: 'Evaluation details' }),
    ).toBeVisible();

    const compatibleEvaluationsResponse = page.waitForResponse(response =>
        response.request().method() === 'GET' &&
        response.url().includes(
            `/v1/analytics/compatible-backtests/${baseEvaluation.id}`,
        ),
    );

    await page.locator('[data-test="quick-action-compare"]').click();

    await expect(
        page.getByRole('heading', { name: 'Compare evaluations' }),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Back to evaluation details' }),
    ).toBeVisible();

    const compatibleEvaluations = await readJson<BacktestRead[]>(
        await compatibleEvaluationsResponse,
        'Load compatible evaluations',
    );

    expect(compatibleEvaluations).toContainEqual(
        expect.objectContaining({
            id: comparisonEvaluation.id,
            name: comparisonEvaluationName,
        }),
    );

    await page.getByText(
        'Select evaluation to compare with',
        { exact: true },
    ).click();

    const overlapResponse = page.waitForResponse(response =>
        response.request().method() === 'GET' &&
        response.url().includes(
            `/v1/analytics/backtest-overlap/${baseEvaluation.id}/${comparisonEvaluation.id}`,
        ),
    );
    const comparisonPlotDataResponse = page.waitForResponse((response) => {
        if (
            response.request().method() !== 'GET'
            || !response.url().includes('/v1/analytics/evaluation-entry')
        ) {
            return false;
        }

        return new URL(response.url()).searchParams.get('backtestId')
            === comparisonEvaluation.id.toString();
    });

    await page.getByText(comparisonEvaluationName, { exact: true }).click();

    const overlap = await readJson<BacktestDomain>(
        await overlapResponse,
        'Load evaluation overlap',
    );

    expect(overlap.orgUnits.length).toBeGreaterThan(0);
    expect(overlap.splitPeriods.length).toBeGreaterThan(0);
    expect((await comparisonPlotDataResponse).ok()).toBe(true);

    await expect.poll(() => {
        const hashQuery = new URL(page.url()).hash.split('?')[1] ?? '';
        return Object.fromEntries(new URLSearchParams(hashQuery));
    }).toMatchObject({
        baseEvaluation: baseEvaluation.id.toString(),
        comparisonEvaluation: comparisonEvaluation.id.toString(),
    });

    await expect(
        page.getByText(`Evaluation: ${baseEvaluationName}`, {
            exact: true,
        }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
        page.getByText(`Evaluation: ${comparisonEvaluationName}`, {
            exact: true,
        }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Split period', { exact: true }))
        .toBeVisible();

    await page.reload();

    await expect(
        page.getByText(`Evaluation: ${baseEvaluationName}`, {
            exact: true,
        }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
        page.getByText(`Evaluation: ${comparisonEvaluationName}`, {
            exact: true,
        }).first(),
    ).toBeVisible({ timeout: 30_000 });
});
