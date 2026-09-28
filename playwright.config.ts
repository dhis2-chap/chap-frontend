import { defineConfig } from '@playwright/test';
import { getAppOrigin } from './apps/modeling-app/e2e/config';

const isCI = Boolean(process.env.CI);
const appOrigin = getAppOrigin();
const authFile = './playwright/.auth/user.json';

export default defineConfig({
    testDir: './apps/modeling-app/e2e',
    // The DHIS2 route proxy occasionally relays a response that Node's HTTP
    // parser rejects ("Invalid header token"), failing any fixture request.
    retries: isCI ? 1 : 0,
    expect: {
        timeout: isCI ? 30_000 : 10_000,
    },
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
            ? 'pnpm --filter @dhis2-chap/core exec d2-app-scripts build && pnpm --filter @dhis2-chap/ui exec d2-app-scripts build && pnpm --filter @dhis2-chap/modeling-app start'
            : 'pnpm start',
        url: appOrigin,
        reuseExistingServer: !isCI,
        timeout: 180_000,
    },
});
