import { expect, test, type Page } from '@playwright/test';

const REQUIRED_DATA_MAPPINGS = [
    {
        fieldKey: 'disease-cases',
        searchTerm: 'NCLE:',
        optionMatcher: /NCLE:?\s*7\.\s*Dengue cases \(any\)/i,
    },
    {
        fieldKey: 'rainfall',
        searchTerm: 'CCH - Precipitation (CHIRPS)',
        optionMatcher: /CCH\s*-\s*Precipitation \(CHIRPS\)/i,
    },
    {
        fieldKey: 'mean-temperature',
        searchTerm: 'CCH - Air temperature',
        optionMatcher: /CCH\s*-\s*Air temperature \(ERA-?5[-\s]Land\)/i,
    },
] as const;

const getMonthValueWithOffset = (offset: number): string => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
};

const openPeriodPickerAtYear = async (page: Page, triggerDataTest: string, periodId: string) => {
    await page.locator(`[data-test="${triggerDataTest}"]`).click();

    const targetYear = Number(periodId.slice(0, 4));
    const visibleYear = page.locator(`[data-test="${triggerDataTest}-visible-year"]`);

    await visibleYear.selectOption(String(targetYear));
    await expect(visibleYear).toHaveValue(String(targetYear));
};

const selectPeriod = async (page: Page, triggerDataTest: string, periodId: string) => {
    await openPeriodPickerAtYear(page, triggerDataTest, periodId);

    await page.locator(`[data-test="${triggerDataTest}-option-${periodId}"]`).click();
};

const isBacktestCreateRequest = (url: string, method: string): boolean => {
    return method === 'POST' && url.includes('/analytics/create-backtest-with-data/');
};

const isBacktestImportRequest = (url: string, method: string): boolean => {
    if (!isBacktestCreateRequest(url, method)) {
        return false;
    }

    const dryRunQuery = new URL(url).searchParams.get('dryRun');
    return dryRunQuery === 'false';
};

const stubCreateBacktestWithData = async (page: Page) => {
    await page.route('**/analytics/create-backtest-with-data/*', async (route) => {
        const request = route.request();
        if (!isBacktestCreateRequest(request.url(), request.method())) {
            await route.continue();
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: null,
                importedCount: 1,
                rejected: [],
            }),
        });
    });
};

const selectOrgUnitLevel = async (page: Page) => {
    await page.getByRole('button', { name: 'Select organisation units' }).click();

    const modal = page.locator('[role="dialog"]').filter({
        has: page.getByRole('heading', { name: 'Select Organisation Units' }),
    }).first();
    await expect(modal).toBeVisible();

    const levelSelect = modal.locator('[data-test="org-unit-level-select"]');
    await expect(levelSelect).toBeVisible();
    await levelSelect.click();

    const firstNonRootLevelOption = page.getByText('Province', { exact: true }).first();
    await expect(firstNonRootLevelOption).toBeVisible();
    await firstNonRootLevelOption.click();

    await expect(modal.getByText('Nothing selected')).not.toBeVisible();

    await modal.getByRole('button', { name: 'Confirm Selection' }).click();
    await expect(modal).not.toBeVisible();
    await expect(page.getByText('Nothing selected')).not.toBeVisible();
};

const selectKnownModel = async (page: Page) => {
    await page.getByRole('button', { name: 'Select model' }).click();

    const modal = page.locator('[role="dialog"]').filter({
        has: page.getByRole('heading', { name: 'Select Model' }),
    }).first();
    await expect(modal).toBeVisible();

    const selectModelButton = modal.locator('[data-test="model-select-naive-model"]');
    await expect(selectModelButton).toBeVisible();
    await selectModelButton.click();

    await modal.getByRole('button', { name: 'Confirm Selection' }).click();
    await expect(modal).not.toBeVisible();
};

const mapFeatureToDataItem = async (
    page: Page,
    fieldKey: string,
    searchTerm: string,
    optionMatcher: RegExp,
) => {
    const mappingField = page.locator(`[data-test="feature-mapping-${fieldKey}"]`);
    await expect(mappingField).toBeVisible();

    await mappingField.locator(`[data-test="feature-mapping-${fieldKey}-trigger"]`).click();

    const searchInput = page.locator(`[data-test="feature-mapping-${fieldKey}-search"]`);
    await expect(searchInput).toBeVisible();
    await searchInput.fill(searchTerm);

    const dataItemOption = page.getByRole('option', { name: optionMatcher }).first();
    await expect(dataItemOption).toBeVisible();
    await dataItemOption.click();
};

const mapRequiredDataSources = async (page: Page) => {
    await page.getByRole('button', { name: 'Configure sources' }).click();

    const modal = page.locator('[role="dialog"]').filter({
        has: page.getByRole('heading', { name: 'Map Data Items' }),
    }).first();
    await expect(modal).toBeVisible();

    const saveButton = modal.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeVisible();

    for (const mapping of REQUIRED_DATA_MAPPINGS) {
        await mapFeatureToDataItem(
            page,
            mapping.fieldKey,
            mapping.searchTerm,
            mapping.optionMatcher,
        );
    }

    await expect(saveButton).toBeEnabled();

    await saveButton.click();
    await expect(modal).not.toBeVisible();
};

type PrepareValidFormDataOptions = {
    fromPeriodId?: string;
    toPeriodId?: string;
};

const prepareValidFormData = async (
    page: Page,
    name: string,
    options: PrepareValidFormDataOptions = {},
) => {
    const twoMonthsAgo = getMonthValueWithOffset(-2);
    const previousMonth = getMonthValueWithOffset(-1);
    const nextMonth = getMonthValueWithOffset(1);
    const fromPeriodId = options.fromPeriodId ?? twoMonthsAgo;
    const toPeriodId = options.toPeriodId ?? previousMonth;

    await page.locator('[data-test="evaluation-name-input"] input').fill(name);
    await selectPeriod(page, 'evaluation-from-period-input', fromPeriodId);
    await selectPeriod(page, 'evaluation-to-period-input', toPeriodId);
    await selectOrgUnitLevel(page);
    await selectKnownModel(page);
    await mapRequiredDataSources(page);

    return { twoMonthsAgo, previousMonth, nextMonth, fromPeriodId, toPeriodId };
};

test('validates period rules with invalid values', async ({ page }) => {
    const newEvaluationUrl = '/#/evaluate/new';

    await stubCreateBacktestWithData(page);

    let backtestCreateRequestCount = 0;
    page.on('request', (request) => {
        if (isBacktestCreateRequest(request.url(), request.method())) {
            backtestCreateRequestCount += 1;
        }
    });

    await page.goto(newEvaluationUrl);
    const { twoMonthsAgo, previousMonth, nextMonth } = await prepareValidFormData(
        page,
        'Validation check',
    );

    await selectPeriod(page, 'evaluation-from-period-input', previousMonth);
    await selectPeriod(page, 'evaluation-to-period-input', twoMonthsAgo);
    await page.getByRole('button', { name: 'Start dry run' }).click();
    await expect(page.getByText('End period must be after start period')).toBeVisible();
    await expect(backtestCreateRequestCount).toBe(0);

    await selectPeriod(page, 'evaluation-from-period-input', twoMonthsAgo);
    await selectPeriod(page, 'evaluation-to-period-input', previousMonth);
    await openPeriodPickerAtYear(page, 'evaluation-to-period-input', nextMonth);
    await expect(page.locator(`[data-test="evaluation-to-period-input-option-${nextMonth}"]`)).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(backtestCreateRequestCount).toBe(0);
});

test('accepts valid values without client-side validation errors', async ({ page }) => {
    const newEvaluationUrl = '/#/evaluate/new';

    await stubCreateBacktestWithData(page);
    let backtestCreateRequestCount = 0;
    page.on('request', (request) => {
        if (isBacktestCreateRequest(request.url(), request.method())) {
            backtestCreateRequestCount += 1;
        }
    });

    await page.goto(newEvaluationUrl);

    await prepareValidFormData(page, 'Valid e2e evaluation');
    const createBacktestRequest = page.waitForRequest(request =>
        isBacktestCreateRequest(request.url(), request.method()),
    );
    await page.getByRole('button', { name: 'Start dry run' }).click();
    await createBacktestRequest;
    await expect(backtestCreateRequestCount).toBe(1);
});

test('submits valid data, navigates to jobs, and shows the created job', async ({ page }) => {
    const newEvaluationUrl = '/#/evaluate/new';
    const evaluationName = `E2E import ${Date.now()}`;

    await page.goto(newEvaluationUrl);

    await prepareValidFormData(page, evaluationName, {
        fromPeriodId: '202001',
        toPeriodId: '202412',
    });

    const createImportRequest = page.waitForRequest(request =>
        isBacktestImportRequest(request.url(), request.method()),
    );
    const createImportResponse = page.waitForResponse(response =>
        isBacktestImportRequest(response.url(), response.request().method()),
    );

    await page.getByRole('button', { name: 'Start import' }).click();

    const request = await createImportRequest;
    await expect(
        request.postDataJSON() as { name?: string },
    ).toMatchObject({ name: evaluationName });

    const response = await createImportResponse;
    await expect(response.ok()).toBeTruthy();
    const importResponseBody = (await response.json()) as { id?: string | null };
    await expect(importResponseBody.id).toBeTruthy();

    await expect(page).toHaveURL(/\/#\/jobs(?:\?.*)?$/);
    await expect(page.getByRole('heading', { name: 'Active jobs' })).toBeVisible();
    await expect(page.getByRole('cell', { name: evaluationName })).toBeVisible();
});

test('submits valid data, navigates to jobs, and auto-updates the created job to success', async ({ page }) => {
    const newEvaluationUrl = '/#/evaluate/new';
    const evaluationName = `E2E successful evaluation ${Date.now()}`;

    await page.goto(newEvaluationUrl);

    await prepareValidFormData(page, evaluationName, {
        fromPeriodId: '202001',
        toPeriodId: '202412',
    });

    const createImportRequest = page.waitForRequest(request =>
        isBacktestImportRequest(request.url(), request.method()),
    );
    const createImportResponse = page.waitForResponse(response =>
        isBacktestImportRequest(response.url(), response.request().method()),
    );

    await page.getByRole('button', { name: 'Start import' }).click();

    const request = await createImportRequest;
    await expect(
        request.postDataJSON() as { name?: string },
    ).toMatchObject({ name: evaluationName });

    const response = await createImportResponse;
    await expect(response.ok()).toBeTruthy();
    const importResponseBody = (await response.json()) as { id?: string | null };
    await expect(importResponseBody.id).toBeTruthy();

    await expect(page).toHaveURL(/\/#\/jobs(?:\?.*)?$/);
    await expect(page.getByRole('heading', { name: 'Active jobs' })).toBeVisible();

    const createdJobRow = page.locator('tr').filter({
        has: page.getByRole('cell', { name: evaluationName }),
    }).first();

    await expect(createdJobRow).toBeVisible();
    await expect(createdJobRow.getByText('Success')).toBeVisible({ timeout: 10_000 });
});

test('warns before leaving a form with unsaved changes', async ({ page }) => {
    const newEvaluationUrl = '/#/evaluate/new';

    await page.goto(newEvaluationUrl);

    await page.locator('[data-test="evaluation-name-input"] input').fill('Unsaved evaluation');
    await page.getByRole('button', { name: 'Back to evaluations' }).click();

    await expect(page.getByRole('heading', { name: 'Unsaved changes' })).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/#\/evaluate\/new$/);

    await page.getByRole('button', { name: 'Back to evaluations' }).click();
    await page.getByRole('button', { name: 'Leave page' }).click();

    await expect(page).toHaveURL(/\/#\/evaluate$/);
    await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible();
});
