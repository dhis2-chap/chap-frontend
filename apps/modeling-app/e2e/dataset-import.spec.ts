import { expect, test } from '@playwright/test';
import type { DataSetWithObservations, DatasetMakeRequest, ImportSummaryResponse, SystemInfoResponse } from '@dhis2-chap/ui';
import { chapUrl, getChap, readJson } from './helpers/evaluation-fixtures';
import { selectPeriod } from './helpers/period-picker';
import type { AnalyticsResponse } from '../src/components/ModelExecutionForm/utils/queryUtils';
import { indexObservations } from '../src/components/InputCompleteness/inputCompleteness';
import { isVersionCompatible } from '../src/utils/compareVersions';

test('checks and imports the same dataset values with the supported observation format', async ({ page }) => {
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

    const analyticsResponse = page.waitForResponse(async response => (
        response.request().method() === 'GET' &&
        /\/(?:analytics(?:\.json)?|query\/alias\/[^/]+)$/.test(new URL(response.url()).pathname) &&
        Array.isArray((await response.json()).rows)
    ));
    const checkResponse = page.waitForResponse(response => response.url().includes('/analytics/make-dataset'));
    await page.getByRole('button', { name: 'Check data', exact: true }).click();
    const response = await checkResponse;
    const summary = await readJson<ImportSummaryResponse>(response, 'Check dataset');
    expect(summary.importedCount).toBeGreaterThan(0);
    const request = response.request().postDataJSON() as DatasetMakeRequest;
    expect(request).toHaveProperty(supportsColumnar ? 'providedDataColumns' : 'providedData');
    expect(request).not.toHaveProperty(supportsColumnar ? 'providedData' : 'providedDataColumns');

    // The previous request format, built independently from the real DHIS2 response.
    const analytics = await readJson<AnalyticsResponse['response']>(await analyticsResponse, 'Load dataset analytics');
    const legacyObservations = request.dataSources!.flatMap(source => analytics.rows
        .filter(row => row[0] === source.dataElementId)
        .map(([, orgUnit, period, value]) => ({
            orgUnit, period, featureName: source.covariate,
            value: value === '' || !Number.isFinite(Number(value)) ? null : Number(value),
        })));
    expect(indexObservations(request.providedDataColumns ?? request.providedData!)).toEqual(indexObservations(legacyObservations));
    const legacyRequest = { ...request, providedData: legacyObservations };
    delete legacyRequest.providedDataColumns;
    const legacySummary = await readJson<ImportSummaryResponse>(await page.request.post(chapUrl('/v1/analytics/make-dataset'), {
        params: { dryRun: 'true' },
        data: legacyRequest,
    }), 'Check legacy dataset');
    expect(legacySummary).toEqual(summary);
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Data completeness' })).toBeVisible();
    await expect(page.getByText(/values present/)).toBeVisible();

    const createResponse = page.waitForResponse(response => response.url().includes('/analytics/make-dataset'));
    await page.getByRole('button', { name: 'Create dataset', exact: true }).click();
    const created = await createResponse;
    expect(created.request().postDataJSON()).toEqual(request);
    const imported = await readJson<ImportSummaryResponse>(created, 'Import dataset');
    expect(imported.id).toBeTruthy();
    expect(imported.importedCount).toBe(summary.importedCount);
    expect(imported.rejected).toEqual(summary.rejected);
    await expect(page.getByText('Dataset created', { exact: true })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'New evaluation', exact: true }).click();
    await expect(page).toHaveURL(/\/#\/evaluate\/from-dataset\?datasetId=\d+$/);
    const datasetId = new URLSearchParams(page.url().split('?')[1]).get('datasetId');
    const saved = await readJson<DataSetWithObservations>(await getChap(page, `/v1/crud/datasets/${datasetId}`), 'Read imported dataset');
    expect(saved.name).toBe(name);
    // Chap omits rejected locations, but keeps all values for the locations it imports.
    const accepted = new Set(saved.orgUnits);
    expect(accepted.size).toBeGreaterThan(0);
    expect(indexObservations(saved.observations)).toEqual(indexObservations(legacyObservations.filter(observation => accepted.has(observation.orgUnit))));
});
