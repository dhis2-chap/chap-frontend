import { defineConfig } from '@playwright/test';
import { getAppOrigin } from './apps/modeling-app/e2e/config';

export default defineConfig({
    testDir: './apps/modeling-app/e2e',
    globalSetup: './apps/modeling-app/e2e/global.setup.ts',
    use: {
        baseURL: getAppOrigin(),
        storageState: './apps/modeling-app/e2e/.auth/user.json',
    },
    webServer: {
        command: 'pnpm --filter @dhis2-chap/modeling-app start -- --port 3000 --host 0.0.0.0',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
});
