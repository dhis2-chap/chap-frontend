import { expect, test } from '@playwright/test';
import type { ModelTemplateRead, Settings, WeatherProviderInfo } from '@dhis2-chap/ui';
import { chapUrl, getChap, readJson } from './helpers/evaluation-fixtures';

let settingsToRestore: Settings | undefined;

test.afterEach(async ({ page }) => {
    // Installation-wide defaults also affect other tests and local users.
    if (settingsToRestore) {
        await readJson<Settings>(await page.request.put(chapUrl('/v1/settings'), { data: settingsToRestore }), 'Restore settings');
        settingsToRestore = undefined;
    }
});

test('saves modeling defaults and reloads independent weekly and monthly values', async ({ page }) => {
    test.setTimeout(90_000);
    const response = await getChap(page, '/v1/settings');
    test.skip(response.status() === 404, 'This CHAP Core version does not provide settings');
    const original = await readJson<Settings>(response, 'Load settings');
    settingsToRestore = original;
    const models = await readJson<ModelTemplateRead[]>(await getChap(page, '/v1/crud/model-templates'), 'Load baseline models');
    const baseline = models.find(model => model.role === 'baseline' && model.name !== original.defaultBaselineModel)!;
    expect(baseline).toBeDefined();
    const providers = await readJson<WeatherProviderInfo[]>(await getChap(page, '/v1/analytics/weather-providers'), 'Load weather providers');
    const provider = providers.find(item => item.id !== original.weeklyBacktestParams.futureWeatherProvider)!;
    expect(provider).toBeDefined();
    const [first, second] = original.metricSortOrder;
    const expected: Settings = {
        ...original,
        metricSortOrder: [second, first, ...original.metricSortOrder.slice(2)],
        selectedMetrics: original.selectedMetrics.includes(first)
            ? original.selectedMetrics.filter(id => id !== first)
            : [...original.selectedMetrics, first],
        defaultBaselineModel: baseline.name,
        weeklyBacktestParams: { nPeriods: 9, nSplits: 8, stride: 2, nRetrain: 2, futureWeatherProvider: provider.id },
        monthlyBacktestParams: { nPeriods: 4, nSplits: 5, stride: 3, nRetrain: 3, futureWeatherProvider: original.monthlyBacktestParams.futureWeatherProvider },
    };

    await page.goto('/#/settings');
    await page.getByRole('link', { name: 'Modeling defaults', exact: true }).click();
    const save = page.getByRole('button', { name: 'Save changes', exact: true });
    await expect(save).toBeDisabled();
    for (const period of ['weeklyBacktestParams', 'monthlyBacktestParams'] as const) {
        await expect(page.locator(`[data-test="${period}-nPeriods"] input`)).toHaveValue(String(original[period].nPeriods));
    }
    const firstRow = page.locator(`[data-test="default-metric-${first}"]`);
    await firstRow.getByRole('checkbox').click();
    await firstRow.getByRole('button', { name: /down$/ }).click();
    await page.locator('[data-test="default-baseline-model"]').click();
    await page.getByText(baseline.displayName || baseline.name, { exact: true }).click();

    for (const period of ['weeklyBacktestParams', 'monthlyBacktestParams'] as const) {
        for (const key of ['nPeriods', 'nSplits', 'stride', 'nRetrain'] as const) {
            await page.locator(`[data-test="${period}-${key}"] input`).fill(String(expected[period][key]));
        }
        if (period === 'weeklyBacktestParams') {
            await expect(page.locator('[data-test="monthlyBacktestParams-nPeriods"] input')).toHaveValue(String(original.monthlyBacktestParams.nPeriods));
        }
    }
    await page.locator('[data-test="weeklyBacktestParams-futureWeatherProvider"]').click();
    await page.getByText(provider.displayName, { exact: true }).click();

    const savedResponse = page.waitForResponse(res => res.url().endsWith('/v1/settings') && res.request().method() === 'PUT');
    await save.click();
    const stored = await readJson<Settings>(await savedResponse, 'Save modeling defaults');
    // CHAP returns selected metrics in the configured sort order.
    expect(stored).toEqual({ ...expected, selectedMetrics: expected.metricSortOrder.filter(id => expected.selectedMetrics.includes(id)) });
    await expect(save).toBeDisabled();

    await page.getByRole('link', { name: 'General', exact: true }).click();
    await page.getByRole('link', { name: 'Modeling defaults', exact: true }).click();
    await expect(page.locator('[data-test="weeklyBacktestParams-nPeriods"] input')).toHaveValue('9');
    await page.reload();
    await expect(page.locator('[data-test^="default-metric-"]').first()).toHaveAttribute('data-test', `default-metric-${second}`);
    await expect(firstRow.getByRole('checkbox')).toBeChecked({ checked: expected.selectedMetrics.includes(first) });
    await expect(page.locator('[data-test="default-baseline-model"]')).toContainText(baseline.displayName || baseline.name);
    await expect(page.locator('[data-test="weeklyBacktestParams-futureWeatherProvider"]')).toContainText(provider.displayName);
    for (const period of ['weeklyBacktestParams', 'monthlyBacktestParams'] as const) {
        for (const key of ['nPeriods', 'nSplits', 'stride', 'nRetrain'] as const) {
            await expect(page.locator(`[data-test="${period}-${key}"] input`)).toHaveValue(String(expected[period][key]));
        }
    }

    await page.locator('[data-test="weeklyBacktestParams-nPeriods"] input').fill('99');
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
    await expect(page.locator('[data-test="weeklyBacktestParams-nPeriods"] input')).toHaveValue('9');
    await expect(save).toBeDisabled();
});
