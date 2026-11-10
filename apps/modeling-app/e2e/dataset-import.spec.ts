import { expect, test, type Page } from '@playwright/test';
import type { DataSetWithObservations, DatasetMakeRequest, SystemInfoResponse } from '@dhis2-chap/ui';
import { getChap, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';
import { indexObservations } from '../src/components/InputCompleteness/inputCompleteness';
import { isVersionCompatible } from '../src/utils/compareVersions';

const fillDatasetForm = async (page: Page, name: string) => {
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
};

test('checks and imports dataset values in the observation format Chap supports', async ({ page }) => {
    test.setTimeout(90_000);
    const name = `E2E dataset columns ${Date.now()}`;
    const status = await readJson<SystemInfoResponse>(await getChap(page, '/system/info'), 'Load Chap version');
    const supportsColumnar = isVersionCompatible(status.chap_core_version, '2.7.0');
    await fillDatasetForm(page, name);

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

test('saves masked ranges and shows them on the dataset', async ({ page }) => {
    test.setTimeout(90_000);
    const status = await readJson<SystemInfoResponse>(await getChap(page, '/system/info'), 'Load Chap version');
    test.skip(!isVersionCompatible(status.chap_core_version, '2.6.0'), 'Masked ranges require Chap Core 2.6.0');
    await fillDatasetForm(page, `E2E masked dataset ${Date.now()}`);

    await page.getByRole('button', { name: 'Add masked range', exact: true }).click();
    await selectPeriod(page, 'masked-range-start-0', '202003');
    await selectPeriod(page, 'masked-range-end-0', '202005');
    await page.locator('[data-test="masked-range-name-0"] input').fill('COVID');
    await page.getByRole('button', { name: 'Add masked range', exact: true }).click();
    await selectPeriod(page, 'masked-range-start-1', '202008');
    await selectPeriod(page, 'masked-range-end-1', '202008');

    await page.getByRole('button', { name: 'Create dataset', exact: true }).click();
    await expect(page.getByText('Dataset created', { exact: true })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'New evaluation', exact: true }).click();
    await expect(page).toHaveURL(/\/#\/evaluate\/from-dataset\?datasetId=\d+$/);
    const datasetId = new URLSearchParams(page.url().split('?')[1]).get('datasetId');
    const saved = await readJson<DataSetWithObservations>(await getChap(page, `/v1/crud/datasets/${datasetId}`), 'Read masked dataset');
    expect(saved.maskedRanges).toEqual([
        { start: '202003', end: '202005', name: 'COVID' },
        { start: '202008', end: '202008', name: '' },
    ]);

    await page.goto(`/#/datasets/${datasetId}`);
    await expect(page.locator('[data-test="dataset-masked-ranges"]').getByRole('listitem'))
        .toHaveText(['COVID — Mar 2020 to May 2020', 'Aug 2020 to Aug 2020']);
});
