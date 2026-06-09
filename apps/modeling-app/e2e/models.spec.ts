import { expect, test, type Page } from '@playwright/test';
import type {
    ConfiguredModelDB,
    ModelConfigurationCreate,
    ModelSpecRead,
    ModelTemplateRead,
} from '@dhis2-chap/ui';
import { chapUrl, readJson } from './helpers/evaluation-fixtures';

const NAIVE_MODEL_TEMPLATE_NAME = 'naive_model';
const DHIS2_USERNAME = process.env.E2E_DHIS2_USERNAME ?? 'system';
const DHIS2_PASSWORD = process.env.E2E_DHIS2_PASSWORD ?? 'System123';

test.setTimeout(75_000);

const waitForModelsPage = async (page: Page) => {
    const signInButton = page.getByRole('button', { name: 'Sign in' });
    const modelsHeading = page.getByRole('heading', { name: 'Models' });
    const waitForVisible = async <T>(locator: ReturnType<Page['locator']>, result: T) => locator
        .waitFor({ state: 'visible', timeout: 20_000 })
        .then(() => result)
        .catch(() => false);
    const pageState = await Promise.race([
        waitForVisible(signInButton, 'sign-in' as const),
        waitForVisible(modelsHeading, 'models' as const),
    ]);

    if (pageState === 'models') {
        return;
    }

    if (pageState !== 'sign-in') {
        throw new Error('Models page did not load and the sign-in dialog did not appear.');
    }

    await page.getByLabel('Username').fill(DHIS2_USERNAME);
    await page.getByLabel('Password').fill(DHIS2_PASSWORD);
    await signInButton.click();
    await expect(modelsHeading).toBeVisible({ timeout: 20_000 });
};

const createArchivedConfiguredModel = async (page: Page, name: string) => {
    const templates = await readJson<ModelTemplateRead[]>(
        await page.request.get(chapUrl('/v1/crud/model-templates')),
        'Load model templates',
    );
    const naiveModelTemplate = templates.find(template => template.name === NAIVE_MODEL_TEMPLATE_NAME);

    if (!naiveModelTemplate) {
        throw new Error(`Could not find the ${NAIVE_MODEL_TEMPLATE_NAME} model template.`);
    }

    const payload: ModelConfigurationCreate = {
        name,
        modelTemplateId: naiveModelTemplate.id,
        userOptionValues: {},
        additionalContinuousCovariates: [],
    };

    const model = await readJson<ConfiguredModelDB>(
        await page.request.post(chapUrl('/v1/crud/configured-models'), { data: payload }),
        'Create configured model',
    );

    if (!model.id) {
        throw new Error('Create configured model did not return an id.');
    }

    const archiveResponse = await page.request.delete(chapUrl(`/v1/crud/configured-models/${model.id}`));

    if (!archiveResponse.ok()) {
        throw new Error(
            `Archive configured model failed with ${archiveResponse.status()}: ${await archiveResponse.text()}`,
        );
    }

    return model;
};

test('shows archived models when Include archived is enabled', async ({ page }) => {
    const modelName = `E2E hidden model ${Date.now()}`;
    const archivedModel = await createArchivedConfiguredModel(page, modelName);

    const modelsResponse = page.waitForResponse(response =>
        response.request().method() === 'GET' &&
        response.url().includes('/v1/crud/configured-models'),
    );

    await page.goto('/#/models');
    await waitForModelsPage(page);

    const loadedModels = await readJson<ModelSpecRead[]>(
        await modelsResponse,
        'Load configured models',
    );
    const loadedArchivedModel = loadedModels.find(model => model.id === archivedModel.id);

    expect(loadedArchivedModel?.archived).toBe(true);

    const displayName = loadedArchivedModel?.displayName || loadedArchivedModel?.name;

    if (!displayName) {
        throw new Error(`Loaded archived model ${archivedModel.id} did not have a display name or name.`);
    }

    await expect(page.getByRole('heading', { name: 'Models' })).toBeVisible();
    await page.getByPlaceholder('Search').fill(displayName);

    const archivedRow = page.getByRole('row').filter({
        has: page.getByText(displayName, { exact: true }),
    });

    await expect(archivedRow).toHaveCount(0);

    await page.getByRole('checkbox', { name: 'Include archived' }).click();

    await expect(page).toHaveURL(/includeArchived=true/);
    await expect(archivedRow).toBeVisible();
    await expect(archivedRow.getByText('Archived')).toBeVisible();
});
