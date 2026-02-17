import { expect, test } from '@playwright/test';

const APP_URL = process.env.E2E_APP_URL ?? 'http://localhost:3000/#/evaluate';

test('logs in and loads the evaluations table', async ({ page }) => {
    await page.goto(APP_URL);

    await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
});
