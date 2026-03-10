import { expect, test } from '@playwright/test';

test('logs in and loads the evaluations table', async ({ page }) => {
    await page.goto('/#/evaluate');

    await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
});
