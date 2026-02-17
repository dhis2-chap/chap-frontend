import { defineConfig } from '@playwright/test';
import { getAppOrigin } from './apps/modeling-app/e2e/config';

export default defineConfig({
    testDir: './apps/modeling-app/e2e',
    globalSetup: './apps/modeling-app/e2e/global.setup.ts',
    use: {
        baseURL: getAppOrigin(),
        storageState: './apps/modeling-app/e2e/.auth/user.json',
    },
});
