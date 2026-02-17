import { expect, test } from '@playwright/test';

const APP_URL = process.env.E2E_APP_URL ?? 'http://localhost:3000/#/evaluate';

test('logs in and loads the evaluations table', async ({ page }) => {
    await page.goto(APP_URL);

    await expect(page).toHaveURL(/#\/evaluate(?:[/?].*)?$/);
    await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible();

    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    const headers = ['ID', 'Name', 'Created', 'Model', 'Locations', 'Actions'];
    for (const header of headers) {
        await expect(
            page.getByRole('columnheader', { name: header, exact: true }),
        ).toBeVisible();
    }

    const emptyState = page.getByText('No evaluations available');
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
        return;
    }

    const rowCount = await table.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
});
