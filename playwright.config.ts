import { defineConfig } from '@playwright/test';
import { getAppOrigin } from './apps/modeling-app/e2e/config';

const __env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;
const __isCI = !!__env.CI;
const __appOrigin = getAppOrigin();

export default defineConfig({
    testDir: './apps/modeling-app/e2e',
    globalSetup: './apps/modeling-app/e2e/global.setup.ts',
    use: {
        baseURL: __appOrigin,
        storageState: './apps/modeling-app/e2e/.auth/user.json',
        video: 'retain-on-failure',
    },
    webServer: {
        // In CI, avoid racing the workspace build graph by building UI first.
        // This prevents transient "missing build/*" errors that can be masked locally.
        command: __isCI
            ? 'pnpm --filter @dhis2-chap/ui build && pnpm --filter @dhis2-chap/modeling-app start'
            : 'pnpm start',
        // Keep the webServer URL aligned with baseURL to avoid
        // host mismatches (localhost vs 127.0.0.1) affecting cookies and localStorage.
        url: __appOrigin,
        reuseExistingServer: !__isCI,
        timeout: 180_000,
    },
});
