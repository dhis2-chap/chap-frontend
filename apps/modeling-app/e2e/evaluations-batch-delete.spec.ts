import { expect, test, type Locator, type Page } from '@playwright/test';
import type { BacktestRead } from '@dhis2-chap/ui';
import { createCompletedNaiveEvaluation } from './helpers/evaluation-fixtures';

// The batch delete calls DELETE /v1/crud/backtests?ids=<csv>; the single-row
// delete uses DELETE /v1/crud/backtests/{id}, so matching on the pathname
// alone is enough to tell the two apart.
const isBatchDeleteRequest = (url: string, method: string): boolean => {
    return method === 'DELETE' && new URL(url).pathname.endsWith('/v1/crud/backtests');
};

const selectEvaluationRow = async (page: Page, evaluation: BacktestRead): Promise<Locator> => {
    const row = page.locator('tr').filter({
        has: page.getByRole('link', { name: evaluation.name ?? '', exact: true }),
    });
    await expect(row).toBeVisible();
    await row.getByRole('checkbox').click();
    return row;
};

// The two tests share the same pair of evaluations: the failure test proves the
// rows survive a failed delete, the success test then deletes them for real.
test.describe.serial('batch delete evaluations', () => {
    let evaluations: BacktestRead[];

    test('keeps rows and selection when the batch delete request fails', async ({ page }) => {
        test.setTimeout(480_000);
        const stamp = Date.now();
        evaluations = await Promise.all([
            createCompletedNaiveEvaluation(page, `E2E batch delete A ${stamp}`),
            createCompletedNaiveEvaluation(page, `E2E batch delete B ${stamp}`),
        ]);

        await page.route(/\/v1\/crud\/backtests(?:\?|$)/, async (route) => {
            if (isBatchDeleteRequest(route.request().url(), route.request().method())) {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'E2E forced failure' }),
                });
                return;
            }
            await route.continue();
        });

        await page.goto('/#/evaluate');
        const rows: Locator[] = [];
        for (const evaluation of evaluations) {
            rows.push(await selectEvaluationRow(page, evaluation));
        }
        await expect(page.getByText('2 evaluations selected')).toBeVisible();

        await page.getByRole('button', { name: 'Delete', exact: true }).click();

        await expect(page.getByText('Failed to delete evaluations')).toBeVisible();
        await expect(page.getByText('2 evaluations selected')).toBeVisible();
        for (const row of rows) {
            await expect(row.getByRole('checkbox')).toBeChecked();
            await expect(row).toBeVisible();
        }
    });

    test('deletes the selected evaluations with a comma-joined ids query', async ({ page }) => {
        test.setTimeout(120_000);
        await page.goto('/#/evaluate');
        for (const evaluation of evaluations) {
            await selectEvaluationRow(page, evaluation);
        }
        await expect(page.getByText('2 evaluations selected')).toBeVisible();

        const deleteRequest = page.waitForRequest(request =>
            isBatchDeleteRequest(request.url(), request.method()),
        );
        await page.getByRole('button', { name: 'Delete', exact: true }).click();

        const request = await deleteRequest;
        const ids = new URL(request.url()).searchParams.get('ids')?.split(',') ?? [];
        expect(ids.slice().sort()).toEqual(evaluations.map(evaluation => String(evaluation.id)).sort());

        await expect(page.getByText('Evaluations deleted')).toBeVisible();
        for (const evaluation of evaluations) {
            await expect(page.getByRole('link', { name: evaluation.name ?? '', exact: true })).not.toBeVisible();
        }
    });
});
