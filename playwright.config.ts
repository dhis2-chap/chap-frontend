import { defineConfig } from '@playwright/test';
import { getAppOrigin } from './apps/modeling-app/e2e/config';

const isCI = Boolean(process.env.CI);
const appOrigin = getAppOrigin();
const authFile = './playwright/.auth/user.json';

export default defineConfig({
    testDir: './apps/modeling-app/e2e',
    use: {
        baseURL: appOrigin,
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'setup',
            testMatch: '**/*.setup.ts',
        },
        {
            name: 'chromium',
            testMatch: '**/*.spec.ts',
            dependencies: ['setup'],
            use: {
                storageState: authFile,
            },
        },
    ],
    webServer: {
        command: isCI
            ? 'pnpm --filter @dhis2-chap/ui build && pnpm --filter @dhis2-chap/modeling-app start'
            : 'pnpm start',
        url: appOrigin,
        reuseExistingServer: !isCI,
        timeout: 180_000,
    },
});
