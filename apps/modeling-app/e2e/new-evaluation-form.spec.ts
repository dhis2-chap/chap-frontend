import { expect, test, type Page } from '@playwright/test';

const agentDebugLog = (payload: {
    hypothesisId: string;
    location: string;
    message: string;
    data?: Record<string, unknown>;
    runId?: string;
}) => {
    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: payload.runId ?? 'pre', hypothesisId: payload.hypothesisId, location: payload.location, message: payload.message, data: payload.data ?? {}, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
};

const REQUIRED_DATA_MAPPINGS = [
    {
        fieldKey: 'disease-cases',
        searchTerm: 'Dengue',
        optionMatcher: /Dengue cases \(any\)/,
    },
    {
        fieldKey: 'rainfall',
        searchTerm: 'Precipitation',
        optionMatcher: /Precipitation \(CHIRPS\)/,
    },
    {
        fieldKey: 'mean-temperature',
        searchTerm: 'Air temperature',
        optionMatcher: /Air temperature \(ERA5-Land\)/,
    },
] as const;

const getMonthValueWithOffset = (offset: number): string => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const isBacktestCreateRequest = (url: string, method: string): boolean => {
    return method === 'POST' && url.includes('/analytics/create-backtest-with-data/');
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

    const selectModelButton = modal.locator('[data-test="model-select-naive-model-used-for-testing"]');
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

const prepareValidFormData = async (page: Page, name: string) => {
    const previousMonth = getMonthValueWithOffset(-1);
    const currentMonth = getMonthValueWithOffset(0);
    const nextMonth = getMonthValueWithOffset(1);

    await page.locator('[data-test="evaluation-name-input"] input').fill(name);
    await page.locator('[data-test="evaluation-from-date-input"]').fill(previousMonth);
    await page.locator('[data-test="evaluation-to-date-input"]').fill(currentMonth);
    await selectOrgUnitLevel(page);
    await selectKnownModel(page);
    await mapRequiredDataSources(page);

    return { previousMonth, currentMonth, nextMonth };
};

test('validates period rules with invalid values', async ({ page }) => {
    const newEvaluationUrl = '/#/evaluate/new';

    let lastStep = 'init';
    try {
        await stubCreateBacktestWithData(page);
        lastStep = 'stubbed-backtest';

        let backtestCreateRequestCount = 0;
        page.on('request', (request) => {
            if (isBacktestCreateRequest(request.url(), request.method())) {
                backtestCreateRequestCount += 1;
            }
        });

        page.on('requestfailed', (request) => {
            const failure = request.failure();
            if (!request.url().includes(':8080/') && !request.url().includes(':8000/')) {
                return;
            }
            agentDebugLog({
                hypothesisId: 'H',
                location: 'apps/modeling-app/e2e/new-evaluation-form.spec.ts:requestfailed',
                message: 'Request failed during new evaluation form test',
                data: {
                    lastStep,
                    url: request.url(),
                    method: request.method(),
                    resourceType: request.resourceType(),
                    errorText: failure?.errorText ?? null,
                },
            });
        });

        lastStep = 'goto-new-evaluation';
        await page.goto(newEvaluationUrl);

        lastStep = 'prepare-valid-form-data';
        const { previousMonth, currentMonth, nextMonth } = await prepareValidFormData(
            page,
            'Validation check',
        );

        lastStep = 'set-invalid-end-before-start';
        await page.locator('[data-test="evaluation-from-date-input"]').fill(currentMonth);
        await page.locator('[data-test="evaluation-to-date-input"]').fill(previousMonth);
        await page.getByRole('button', { name: 'Start dry run' }).click();
        await expect(page.getByText('End period must be after start period')).toBeVisible();
        await expect(backtestCreateRequestCount).toBe(0);

        lastStep = 'set-invalid-future-end-date';
        await page.locator('[data-test="evaluation-from-date-input"]').fill(currentMonth);
        await page.locator('[data-test="evaluation-to-date-input"]').fill(nextMonth);
        await page.getByRole('button', { name: 'Start dry run' }).click();
        await expect(page.getByText('End date cannot be in the future')).toBeVisible();
        await expect(backtestCreateRequestCount).toBe(0);
    } catch (err) {
        agentDebugLog({
            hypothesisId: 'G',
            location: 'apps/modeling-app/e2e/new-evaluation-form.spec.ts:invalid-values-failed',
            message: 'New evaluation validation test failed',
            data: {
                lastStep,
                url: page.url(),
                errorMessage: (err as any)?.message ?? String(err),
            },
        });
        throw err;
    }
});

test('accepts valid values without client-side validation errors', async ({ page }) => {
    const newEvaluationUrl = '/#/evaluate/new';

    let lastStep = 'init';
    try {
        await stubCreateBacktestWithData(page);
        lastStep = 'stubbed-backtest';

        let backtestCreateRequestCount = 0;
        page.on('request', (request) => {
            if (isBacktestCreateRequest(request.url(), request.method())) {
                backtestCreateRequestCount += 1;
            }
        });

        page.on('requestfailed', (request) => {
            const failure = request.failure();
            if (!request.url().includes(':8080/') && !request.url().includes(':8000/')) {
                return;
            }
            agentDebugLog({
                hypothesisId: 'H',
                location: 'apps/modeling-app/e2e/new-evaluation-form.spec.ts:requestfailed',
                message: 'Request failed during new evaluation form test',
                data: {
                    lastStep,
                    url: request.url(),
                    method: request.method(),
                    resourceType: request.resourceType(),
                    errorText: failure?.errorText ?? null,
                },
            });
        });

        lastStep = 'goto-new-evaluation';
        await page.goto(newEvaluationUrl);

        lastStep = 'prepare-valid-form-data';
        await prepareValidFormData(page, 'Valid e2e evaluation');
        const createBacktestRequest = page.waitForRequest((request) =>
            isBacktestCreateRequest(request.url(), request.method()),
        );

        lastStep = 'click-start-dry-run';
        await page.getByRole('button', { name: 'Start dry run' }).click();

        lastStep = 'wait-for-create-backtest-request';
        await createBacktestRequest;

        lastStep = 'assert-request-count';
        await expect(backtestCreateRequestCount).toBe(1);
    } catch (err) {
        agentDebugLog({
            hypothesisId: 'G',
            location: 'apps/modeling-app/e2e/new-evaluation-form.spec.ts:valid-values-failed',
            message: 'New evaluation happy-path test failed',
            data: {
                lastStep,
                url: page.url(),
                errorMessage: (err as any)?.message ?? String(err),
            },
        });
        throw err;
    }
});

test('warns before leaving a form with unsaved changes', async ({ page }) => {
    const newEvaluationUrl = '/#/evaluate/new';

    let lastStep = 'init';
    try {
        page.on('requestfailed', (request) => {
            const failure = request.failure();
            if (!request.url().includes(':8080/') && !request.url().includes(':8000/')) {
                return;
            }
            agentDebugLog({
                hypothesisId: 'H',
                location: 'apps/modeling-app/e2e/new-evaluation-form.spec.ts:requestfailed',
                message: 'Request failed during new evaluation form test',
                data: {
                    lastStep,
                    url: request.url(),
                    method: request.method(),
                    resourceType: request.resourceType(),
                    errorText: failure?.errorText ?? null,
                },
            });
        });

        lastStep = 'goto-new-evaluation';
        await page.goto(newEvaluationUrl);

        lastStep = 'fill-name';
        await page.locator('[data-test="evaluation-name-input"] input').fill('Unsaved evaluation');
        await page.getByRole('button', { name: 'Back to evaluations' }).click();

        lastStep = 'assert-unsaved-modal';
        await expect(page.getByRole('heading', { name: 'Unsaved changes' })).toBeVisible();

        lastStep = 'cancel-unsaved';
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page).toHaveURL(/\/#\/evaluate\/new$/);

        lastStep = 'confirm-leave';
        await page.getByRole('button', { name: 'Back to evaluations' }).click();
        await page.getByRole('button', { name: 'Leave page' }).click();

        lastStep = 'assert-returned-evaluations';
        await expect(page).toHaveURL(/\/#\/evaluate$/);
        await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible();
    } catch (err) {
        agentDebugLog({
            hypothesisId: 'G',
            location: 'apps/modeling-app/e2e/new-evaluation-form.spec.ts:unsaved-changes-failed',
            message: 'New evaluation unsaved-changes test failed',
            data: {
                lastStep,
                url: page.url(),
                errorMessage: (err as any)?.message ?? String(err),
            },
        });
        throw err;
    }
});
