import { expect, test } from '@playwright/test';
import type { DataSetWithObservations, DatasetMakeRequest, SystemInfoResponse } from '@dhis2-chap/ui';
import { getChap, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';
import { indexObservations } from '../src/components/InputCompleteness/inputCompleteness';
import { isVersionCompatible } from '../src/utils/compareVersions';

test('checks and imports dataset values in the observation format Chap supports', async ({ page }) => {
    test.setTimeout(90_000);
    const name = `E2E dataset columns ${Date.now()}`;
    const status = await readJson<SystemInfoResponse>(await getChap(page, '/system/info'), 'Load Chap version');
    const supportsColumnar = isVersionCompatible(status.chap_core_version, '2.7.0');

    await page.goto('/#/datasets/new');
    await page.locator('[data-test="evaluation-name-input"] input').fill(name);
    await selectPeriod(page, 'evaluation-from-period-input', '202001');
    await selectPeriod(page, 'evaluation-to-period-input', '202012');
    await page.getByRole('button', { name: 'Select organisation units' }).click();
    const locations = page.getByRole('dialog');
    await locations.locator('[data-test="org-unit-level-select"]').click();
    await page.getByText('Province', { exact: true }).click();
    await locations.getByRole('button', { name: 'Confirm Selection' }).click();
    for (const [index, feature] of ['disease_cases', 'custom_cases'].entries()) {
        await page.getByRole('button', { name: 'Add column', exact: true }).click();
        await page.locator(`[data-test="dataset-column-name-${index}"] input`).fill(feature);
        await page.getByRole('button', { name: 'Select a data item...' }).click();
        await page.getByPlaceholder('Search for indicators, data elements, or program indicators').fill('NCLE:');
        await page.getByRole('option', { name: /NCLE:?\s*7\.\s*Dengue cases \(any\)/i }).click();
    }

    const checkResponse = page.waitForResponse(response => response.url().includes('/analytics/make-dataset'));
    await page.getByRole('button', { name: 'Check data', exact: true }).click();
    const request = (await checkResponse).request().postDataJSON() as DatasetMakeRequest;
    expect(request).toHaveProperty(supportsColumnar ? 'providedDataColumns' : 'providedData');
    expect(request).not.toHaveProperty(supportsColumnar ? 'providedData' : 'providedDataColumns');
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByText(/values present/)).toBeVisible();

    await page.getByRole('button', { name: 'Create dataset', exact: true }).click();
    await expect(page.getByText('Dataset created', { exact: true })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'New evaluation', exact: true }).click();
    await expect(page).toHaveURL(/\/#\/evaluate\/from-dataset\?datasetId=\d+$/);
    const datasetId = new URLSearchParams(page.url().split('?')[1]).get('datasetId');
    const saved = await readJson<DataSetWithObservations>(await getChap(page, `/v1/crud/datasets/${datasetId}`), 'Read imported dataset');
    expect(saved.name).toBe(name);
    // Chap omits rejected locations, but keeps every value for the ones it imports.
    const accepted = new Set(saved.orgUnits);
    const sent = [...indexObservations(request.providedDataColumns ?? request.providedData!)]
        .filter(([key]) => accepted.has(JSON.parse(key)[1]));
    expect(indexObservations(saved.observations)).toEqual(new Map(sent));
});
