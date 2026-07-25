import { expect, test } from '@playwright/test';
import type { BacktestRead } from '@dhis2-chap/ui';
import {
    chapUrl,
    createCompletedNaiveEvaluation,
    readJson,
} from './helpers/evaluation-fixtures';

test.setTimeout(240_000);

test.describe.serial('evaluation management', () => {
    let evaluation: BacktestRead;
    let renamedEvaluationName: string;

    test('renames an evaluation and persists the new name', async ({ page }) => {
        const originalEvaluationName = `E2E evaluation to manage ${Date.now()}`;
        evaluation = await createCompletedNaiveEvaluation(page, originalEvaluationName);
        renamedEvaluationName = `E2E renamed evaluation ${Date.now()}`;

        await page.goto('/#/evaluate');

        await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible();
        await page.getByPlaceholder('Search').fill(originalEvaluationName);

        const evaluationRow = page.getByRole('row').filter({
            has: page.getByRole('link', { name: originalEvaluationName, exact: true }),
        });

        await expect(evaluationRow).toBeVisible();
        await evaluationRow.getByRole('button', { name: 'More' }).click();
        await page.locator('[data-test="backtest-overflow-rename"]').click();

        const renameModal = page.locator('[data-test="edit-backtest-modal"]');
        await expect(renameModal.getByRole('heading', { name: 'Rename evaluation' })).toBeVisible();
        await renameModal.locator('[data-test="backtest-name-input"] input').fill(renamedEvaluationName);

        const renameResponse = page.waitForResponse(response =>
            response.request().method() === 'PATCH' &&
            response.url().includes(`/v1/crud/backtests/${evaluation.id}`),
        );

        await renameModal.locator('[data-test="submit-edit-backtest-button"]').click();

        const renamedEvaluation = await readJson<BacktestRead>(
            await renameResponse,
            'Rename evaluation',
        );

        expect(renamedEvaluation.name).toBe(renamedEvaluationName);
        await expect(renameModal).not.toBeVisible();
        await page.getByPlaceholder('Search').fill(renamedEvaluationName);
        await expect(page.getByRole('link', { name: renamedEvaluationName, exact: true })).toBeVisible();

        await page.reload();

        await expect(page.getByRole('link', { name: renamedEvaluationName, exact: true })).toBeVisible();
    });

    test('deletes the renamed evaluation', async ({ page }) => {
        await page.goto('/#/evaluate');
        await page.getByPlaceholder('Search').fill(renamedEvaluationName);

        const evaluationRow = page.getByRole('row').filter({
            has: page.getByRole('link', { name: renamedEvaluationName, exact: true }),
        });

        await expect(evaluationRow).toBeVisible();
        await evaluationRow.getByRole('button', { name: 'More' }).click();
        await page.locator('[data-test="backtest-overflow-delete"]').click();

        const deleteModal = page.locator('[data-test="delete-backtest-modal"]');
        await expect(deleteModal.getByRole('heading', { name: 'Delete evaluation' })).toBeVisible();

        const deleteResponse = page.waitForResponse(response =>
            response.request().method() === 'DELETE' &&
            response.url().includes(`/v1/crud/backtests/${evaluation.id}`),
        );

        await deleteModal.locator('[data-test="submit-delete-backtest-button"]').click();

        expect((await deleteResponse).ok()).toBe(true);
        await expect(deleteModal).not.toBeVisible();
        await expect(page.getByText('Evaluation deleted')).toBeVisible();
        await expect(evaluationRow).toHaveCount(0);

        const deletedEvaluationResponse = await page.request.get(
            chapUrl(`/v1/crud/backtests/${evaluation.id}/info`),
        );

        expect(deletedEvaluationResponse.status()).toBe(404);
    });
});
