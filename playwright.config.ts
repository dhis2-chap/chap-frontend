import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './apps/modeling-app/e2e',
    globalSetup: './apps/modeling-app/e2e/global.setup.ts',
    workers: 1,
    use: {
        storageState: './apps/modeling-app/e2e/.auth/user.json',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
});
