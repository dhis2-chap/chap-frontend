import { expect, test } from '@playwright/test';

test('logs in and loads the evaluations table', async ({ page }) => {
    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'B', location: 'apps/modeling-app/e2e/evaluations.spec.ts:test-start', message: 'Starting evaluations test', data: { baseURL: (page as any).context?.()._options?.baseURL ?? null }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    page.on('console', (msg) => {
        if (msg.type() !== 'error') {
            return;
        }
        // #region agent log
        fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'E', location: 'apps/modeling-app/e2e/evaluations.spec.ts:console-error', message: 'Browser console error', data: { text: msg.text() }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
    });
    page.on('pageerror', (err) => {
        // #region agent log
        fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'E', location: 'apps/modeling-app/e2e/evaluations.spec.ts:pageerror', message: 'Unhandled page error', data: { message: err?.message ?? String(err) }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
    });
    page.on('response', (response) => {
        const status = response.status();
        if (status < 400) {
            return;
        }
        const url = response.url();
        // Keep scope tight: failures that could block loading the evaluations page.
        if (!url.includes(':8080/') && !url.includes(':8000/')) {
            return;
        }
        // #region agent log
        fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'F', location: 'apps/modeling-app/e2e/evaluations.spec.ts:http-error', message: 'HTTP error response observed', data: { url, status }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
    });

    page.on('request', (request) => {
        if (request.resourceType() !== 'document') {
            return;
        }
        // #region agent log
        fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'B', location: 'apps/modeling-app/e2e/evaluations.spec.ts:document-request', message: 'Document request observed', data: { url: request.url(), method: request.method() }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
    });
    page.on('requestfailed', (request) => {
        const failure = request.failure();
        // #region agent log
        fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'B', location: 'apps/modeling-app/e2e/evaluations.spec.ts:requestfailed', message: 'Request failed', data: { url: request.url(), method: request.method(), resourceType: request.resourceType(), errorText: failure?.errorText ?? null }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
    });

    await page.goto('/#/evaluate');

    // #region agent log
    fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'B', location: 'apps/modeling-app/e2e/evaluations.spec.ts:after-goto', message: 'After page.goto', data: { url: page.url() }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    // The evaluations page waits for route-backed data; allow extra time in CI.
    try {
        await expect(page.getByRole('heading', { name: 'Evaluations' })).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.locator('table').first()).toBeVisible({
            timeout: 30_000,
        });
        // #region agent log
        fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'D', location: 'apps/modeling-app/e2e/evaluations.spec.ts:assertions-pass', message: 'Evaluations page assertions passed', data: { url: page.url() }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
    } catch (err) {
        let bodySnippet: string | null = null;
        try {
            bodySnippet = (await page.locator('body').innerText()).slice(0, 500);
        } catch {
            bodySnippet = null;
        }
        // #region agent log
        fetch('http://127.0.0.1:7500/ingest/4f894227-fdd6-48cb-9d0c-4b19a40eab48', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f2aaee' }, body: JSON.stringify({ sessionId: 'f2aaee', runId: 'pre', hypothesisId: 'D', location: 'apps/modeling-app/e2e/evaluations.spec.ts:assertions-fail', message: 'Evaluations page assertions failed', data: { url: page.url(), errorMessage: (err as any)?.message ?? String(err), bodySnippet }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
        throw err;
    }
});
