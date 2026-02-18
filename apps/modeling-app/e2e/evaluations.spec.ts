import { expect, test } from '@playwright/test';

test('logs in and loads the evaluations table', async ({ page }) => {
    await page.goto('/#/evaluate');

    // The evaluations page waits for route-backed data; allow extra time in CI.
    await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible({
        timeout: 30_000,
    });
    await expect(page.locator('table').first()).toBeVisible({
        timeout: 30_000,
    });
});
