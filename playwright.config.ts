import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './apps/modeling-app/e2e',
    globalSetup: './apps/modeling-app/e2e/global.setup.ts',
    use: {
        storageState: './apps/modeling-app/e2e/.auth/user.json',
    },
});
