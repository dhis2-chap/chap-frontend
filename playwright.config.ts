import { defineConfig } from '@playwright/test';
import { getAppOrigin } from './apps/modeling-app/e2e/config';

const __env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;
const __isCI = !!__env.CI;

// #region agent log
fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'A', location: 'playwright.config.ts:config-load', message: 'Loaded Playwright config', data: { ci: __env.CI ?? null, e2eAppUrl: __env.E2E_APP_URL ?? null, baseURL: getAppOrigin(), webServerUrl: 'http://127.0.0.1:3000', webServerCommand: 'pnpm start', webServerTimeoutMs: 180_000 }, timestamp: Date.now() }) }).catch(() => {});
// #endregion

export default defineConfig({
    testDir: './apps/modeling-app/e2e',
    globalSetup: './apps/modeling-app/e2e/global.setup.ts',
    use: {
        baseURL: getAppOrigin(),
        storageState: './apps/modeling-app/e2e/.auth/user.json',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: {
        // In CI, avoid racing the workspace build graph by building UI first.
        // This prevents transient "missing build/*" errors that can be masked locally.
        command: __isCI
            ? 'pnpm --filter @dhis2-chap/ui build && pnpm --filter @dhis2-chap/modeling-app start'
            : 'pnpm start',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !__isCI,
        timeout: 180_000,
    },
});
