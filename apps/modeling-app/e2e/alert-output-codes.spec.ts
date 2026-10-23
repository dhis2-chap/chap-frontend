import { expect, test } from '@playwright/test';
import type { AlertPolicyCreate, DataBaseResponse } from '@dhis2-chap/ui';
import { chapUrl, readJson } from './helpers/evaluation-fixtures';

test('saves policy output codes and restores them when reopened', async ({ page }) => {
    const name = `E2E alert output codes ${Date.now()}`;
    const data: AlertPolicyCreate = {
        name,
        levels: [
            { name: 'Orange', thresholdParams: { type: 'seasonal', stdMultiplier: 1 }, exceedanceThreshold: 0.5 },
            { name: 'Red', thresholdParams: { type: 'seasonal', stdMultiplier: 2 }, exceedanceThreshold: 0.75 },
        ],
    };
    const policy = await readJson<DataBaseResponse>(await page.request.post(chapUrl('/v1/crud/alert-policies'), { data }), 'Create policy');
    await page.goto('/#/alerts');
    const row = page.getByRole('row').filter({ hasText: name });
    await row.getByRole('button', { name: 'Output codes', exact: true }).click();
    const modal = page.locator('[data-test="edit-alert-policy-output-codes-modal"]');
    await expect(modal.getByLabel('No alert', { exact: true })).toHaveValue('0');
    await expect(modal.getByLabel('Orange', { exact: true })).toHaveValue('1');
    await expect(modal.getByLabel('Red', { exact: true })).toHaveValue('2');
    await modal.getByLabel('No alert', { exact: true }).fill('GREEN');
    await modal.getByLabel('Orange', { exact: true }).fill('ORANGE');
    await modal.getByLabel('Red', { exact: true }).fill('RED');
    const saved = page.waitForResponse(response =>
        ['PUT', 'POST'].includes(response.request().method()) &&
        response.url().endsWith(`/dataStore/modeling/alert-policy-output-codes-${policy.id}`) && response.ok(),
    );
    await modal.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await saved).request().postDataJSON()).toEqual({ noAlert: 'GREEN', levels: { Orange: 'ORANGE', Red: 'RED' } });
    await expect(modal).not.toBeVisible();
    await page.reload();
    await row.getByRole('button', { name: 'Output codes', exact: true }).click();
    await expect(modal.getByLabel('No alert', { exact: true })).toHaveValue('GREEN');
    await expect(modal.getByLabel('Orange', { exact: true })).toHaveValue('ORANGE');
    await expect(modal.getByLabel('Red', { exact: true })).toHaveValue('RED');
});
