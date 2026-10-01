import { expect, test } from '@playwright/test';
import type { JobDescription } from '@dhis2-chap/ui';

test('can reduce the page size after showing all jobs', async ({ page }) => {
    page.setDefaultTimeout(15_000);
    const name = `E2E jobs pagination ${Date.now()}`;
    const jobs: JobDescription[] = Array.from({ length: 6 }, (_, index) => ({
        id: `e2e-jobs-pagination-${index}`,
        type: 'create_backtest',
        name: `${name} ${index}`,
        status: 'SUCCESS',
        start_time: '2026-01-01T00:00:00',
        end_time: '2026-01-01T00:01:00',
        result: null,
    }));
    await page.route(/\/v1\/jobs(\?|$)/, route => route.fulfill({ json: jobs }));

    await page.goto(`/#/jobs?search=${encodeURIComponent(name)}`);
    const pageSize = page.locator('[data-test="dhis2-uiwidgets-pagination-pagesize-select"]');
    const options = page.locator('[data-test="dhis2-uicore-singleselectoption"]');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(6);
    await pageSize.click();
    await options.getByText('100', { exact: true }).click();
    await expect(pageSize).toContainText('100');
    await pageSize.click();
    await options.getByText('5', { exact: true }).click();
    await expect(pageSize).toContainText('5');
    await expect(rows).toHaveCount(5);
    await expect(page).toHaveURL(/pageSize=5/);

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(rows).toHaveCount(1);
    await pageSize.click();
    await options.getByText('10', { exact: true }).click();
    await expect(pageSize).toContainText('10');
    await expect(rows).toHaveCount(6);
    await expect(page.getByText('Page 1 of 1, items 1-6 of 6', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(`/#/jobs?search=${encodeURIComponent(name).replace(/%20/g, '+')}`);
});
